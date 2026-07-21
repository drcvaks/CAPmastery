const fs = require("node:fs/promises");
const path = require("node:path");

const { Client } = require("pg");

const root = path.resolve(__dirname, "..");
const poolerUrlPath = path.join(root, "supabase", ".temp", "pooler-url");
const testPath = path.join(root, "supabase", "tests", "identity_access_rls.test.sql");

async function main() {
  let connectionString;
  try {
    connectionString = (await fs.readFile(poolerUrlPath, "utf8")).trim();
  } catch {
    throw new Error("Link the CAP Mastery Supabase project before running linked database tests.");
  }

  const connectionUrl = new URL(connectionString);
  if (!connectionUrl.password) {
    const databasePassword = process.env.CAP_MASTERY_DB_PASSWORD;
    if (!databasePassword) {
      throw new Error(
        "Set CAP_MASTERY_DB_PASSWORD only for this process before running linked database tests.",
      );
    }
    connectionUrl.password = databasePassword;
  }

  const sql = await fs.readFile(testPath, "utf8");
  const client = new Client({
    connectionString: connectionUrl.toString(),
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const queryResult = await client.query(sql);
    const results = Array.isArray(queryResult) ? queryResult : [queryResult];
    const tapLines = results.flatMap((result) =>
      result.rows.flatMap((row) =>
        Object.values(row).filter(
          (value) => typeof value === "string" && /^(ok|not ok|1\.\.)/.test(value),
        ),
      ),
    );
    const failures = tapLines.filter((line) => line.startsWith("not ok"));
    const successes = tapLines.filter((line) => line.startsWith("ok"));
    const plan = tapLines.find((line) => line === "1..15");

    if (!plan || successes.length !== 15 || failures.length > 0) {
      throw new Error(
        `pgTAP did not pass: plan=${plan ?? "missing"}, passed=${successes.length}, failed=${failures.length}`,
      );
    }

    process.stdout.write(`pgTAP linked database tests passed: ${successes.length}/15\n`);
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Linked database tests failed."}\n`,
  );
  process.exitCode = 1;
});
