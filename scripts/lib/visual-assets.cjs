const fs = require("node:fs");
const path = require("node:path");

const { decodeImportBuffer, parseDelimited } = require("./pilot-import.cjs");

const MANIFEST_FIELDS = ["visual_asset_key", "visual_file_name", "visual_storage_path"];

function parseVisualManifest(buffer) {
  const matrix = parseDelimited(decodeImportBuffer(buffer).replace(/^\uFEFF/, ""), ",");
  if (matrix.length < 2) throw new Error("The visual manifest has no asset rows.");
  const headers = matrix[0];
  const missing = MANIFEST_FIELDS.filter((field) => !headers.includes(field));
  if (missing.length) throw new Error(`Missing visual manifest columns: ${missing.join(", ")}`);
  return matrix.slice(1).map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(
        `Visual manifest row ${index + 2} has ${values.length} fields; expected ${headers.length}.`,
      );
    }
    const source = Object.fromEntries(
      headers.map((header, column) => [header, values[column].trim()]),
    );
    return {
      ...source,
      visual_group: source.visual_group || source.visual_asset_key,
      visual_status: source.visual_status || source.status,
      visual_caption: source.visual_caption || source.visual_description,
      visual_alt_text: source.visual_alt_text || source.visual_description,
      question_count: source.question_count || "",
    };
  });
}

function normalizeStoragePath(value) {
  return String(value).trim().replace(/^\/+/, "");
}

function readPngDimensions(buffer) {
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) {
    throw new Error("Visual asset is not a valid PNG file.");
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function validateVisualManifest(
  rows,
  assetDirectory,
  { expectedAssetCount = 6, expectedQuestionCount = 94 } = {},
) {
  const errors = [];
  const assetKeys = new Set();
  const storagePaths = new Set();
  let questionCount = 0;
  for (const [index, row] of rows.entries()) {
    const label = `Visual manifest row ${index + 2}`;
    const storagePath = normalizeStoragePath(row.visual_storage_path);
    const filePath = path.join(assetDirectory, row.visual_file_name);
    if (!/^[a-z0-9][a-z0-9_-]{2,119}$/.test(row.visual_asset_key)) {
      errors.push(`${label}: invalid visual_asset_key.`);
    }
    if (assetKeys.has(row.visual_asset_key)) errors.push(`${label}: duplicate visual_asset_key.`);
    assetKeys.add(row.visual_asset_key);
    if (row.visual_group !== row.visual_asset_key) {
      errors.push(`${label}: visual_group must match visual_asset_key.`);
    }
    if (!/^[a-z0-9][a-z0-9_.-]{2,199}\.png$/.test(row.visual_file_name)) {
      errors.push(`${label}: visual_file_name must be a safe PNG filename.`);
    }
    if (storagePath !== `assets/cap-visuals/${row.visual_file_name}`) {
      errors.push(`${label}: visual_storage_path does not match the expected private path.`);
    }
    if (storagePaths.has(storagePath)) errors.push(`${label}: duplicate visual_storage_path.`);
    storagePaths.add(storagePath);
    if (row.visual_status !== "approved") errors.push(`${label}: visual_status must be approved.`);
    if (!row.visual_caption || !row.visual_alt_text) {
      errors.push(`${label}: caption and alt text are required.`);
    }
    if (
      row.question_count &&
      (!/^\d+$/.test(row.question_count) || Number(row.question_count) < 1)
    ) {
      errors.push(`${label}: question_count must be a positive integer when supplied.`);
    } else if (row.question_count) {
      questionCount += Number(row.question_count);
    }
    if (!fs.existsSync(filePath)) {
      errors.push(`${label}: ${row.visual_file_name} was not found.`);
    } else {
      try {
        const dimensions = readPngDimensions(fs.readFileSync(filePath));
        if (dimensions.width < 320 || dimensions.height < 240) {
          errors.push(`${label}: visual dimensions are too small.`);
        }
      } catch (error) {
        errors.push(`${label}: ${error.message}`);
      }
    }
  }
  if (rows.length !== expectedAssetCount) {
    errors.push(`Expected ${expectedAssetCount} visual assets but found ${rows.length}.`);
  }
  if (expectedQuestionCount !== null && questionCount !== expectedQuestionCount) {
    errors.push(
      `Expected visual mappings for ${expectedQuestionCount} questions but found ${questionCount}.`,
    );
  }
  return errors;
}

function readLocalEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        const key = line.slice(0, separator).trim();
        const value = line
          .slice(separator + 1)
          .trim()
          .replace(/^(['"])(.*)\1$/, "$2");
        return [key, value];
      }),
  );
}

module.exports = {
  MANIFEST_FIELDS,
  normalizeStoragePath,
  parseVisualManifest,
  readLocalEnv,
  readPngDimensions,
  validateVisualManifest,
};
