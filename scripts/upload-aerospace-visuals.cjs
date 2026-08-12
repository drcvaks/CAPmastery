const fs = require("node:fs/promises");
const path = require("node:path");

const { createClient } = require("@supabase/supabase-js");
const {
  normalizeStoragePath,
  parseVisualManifest,
  readLocalEnv,
  readPngDimensions,
  validateVisualManifest,
} = require("./lib/visual-assets.cjs");

const root = path.resolve(__dirname, "..");
const assetDirectory = path.join(root, "Content", "Aerospace");

function positiveInteger(value, label) {
  if (!/^\d+$/.test(value) || Number(value) < 1) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return Number(value);
}

async function main() {
  const manifestFileName = process.argv[2];
  if (!manifestFileName || path.basename(manifestFileName) !== manifestFileName) {
    throw new Error("Provide a visual manifest filename from Content/Aerospace.");
  }
  const expectedAssetCount = positiveInteger(process.argv[3] ?? "", "Expected asset count");
  const expectedQuestionCount = positiveInteger(
    process.argv[4] ?? "",
    "Expected question mapping count",
  );
  const manifestPath = path.join(assetDirectory, manifestFileName);
  const manifest = parseVisualManifest(await fs.readFile(manifestPath));
  const validationErrors = validateVisualManifest(manifest, assetDirectory, {
    expectedAssetCount,
    expectedQuestionCount,
  });
  if (validationErrors.length) throw new Error(validationErrors.join("\n"));

  const localEnv = readLocalEnv(path.join(root, ".env.local"));
  const projectUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? localEnv.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    localEnv.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    localEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const email = process.env.CAP_MASTERY_ADMIN_EMAIL;
  const password = process.env.CAP_MASTERY_ADMIN_PASSWORD;
  if (!projectUrl || !publishableKey) {
    throw new Error("CAP Mastery Supabase URL and publishable key are required in .env.local.");
  }
  if (!email || !password) {
    throw new Error(
      "Set CAP_MASTERY_ADMIN_EMAIL and CAP_MASTERY_ADMIN_PASSWORD only for this process before uploading.",
    );
  }

  const client = createClient(projectUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  const uploaded = [];
  try {
    for (const asset of manifest) {
      const file = await fs.readFile(path.join(assetDirectory, asset.visual_file_name));
      const storagePath = normalizeStoragePath(asset.visual_storage_path);
      const dimensions = readPngDimensions(file);
      const { error: uploadError } = await client.storage
        .from("learning-visuals")
        .upload(storagePath, file, {
          cacheControl: "31536000",
          contentType: "image/png",
          upsert: true,
        });
      if (uploadError) throw uploadError;
      const { error: registerError } = await client.rpc("admin_register_learning_visual", {
        p_asset_key: asset.visual_asset_key,
        p_storage_path: storagePath,
        p_mime_type: "image/png",
        p_width: dimensions.width,
        p_height: dimensions.height,
        p_alt_text: asset.visual_alt_text,
      });
      if (registerError) throw registerError;
      uploaded.push({
        asset_key: asset.visual_asset_key,
        storage_path: storagePath,
        width: dimensions.width,
        height: dimensions.height,
      });
    }
  } finally {
    await client.auth.signOut().catch(() => undefined);
  }

  process.stdout.write(
    `${JSON.stringify({ uploaded: uploaded.length, assets: uploaded }, null, 2)}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Visual upload failed."}\n`);
  process.exitCode = 1;
});
