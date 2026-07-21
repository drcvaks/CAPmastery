const fs = require("node:fs/promises");
const path = require("node:path");

const { Client } = require("pg");

const root = path.resolve(__dirname, "..");
const poolerUrlPath = path.join(root, "supabase", ".temp", "pooler-url");
const testsDirectory = path.join(root, "supabase", "tests");

function collectTapLines(queryResult) {
  const results = Array.isArray(queryResult) ? queryResult : [queryResult];
  return results.flatMap((result) =>
    result.rows.flatMap((row) =>
      Object.values(row).filter(
        (value) => typeof value === "string" && /^(ok|not ok|1\.\.)/.test(value),
      ),
    ),
  );
}

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

  const testFiles = (await fs.readdir(testsDirectory))
    .filter((fileName) => fileName.endsWith(".test.sql"))
    .sort();
  if (testFiles.length === 0) {
    throw new Error("No pgTAP test files were found.");
  }

  const client = new Client({
    connectionString: connectionUrl.toString(),
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    let totalPlanned = 0;
    let totalPassed = 0;

    for (const testFile of testFiles) {
      const sql = await fs.readFile(path.join(testsDirectory, testFile), "utf8");
      const tapLines = collectTapLines(await client.query(sql));
      const failures = tapLines.filter((line) => line.startsWith("not ok"));
      const successes = tapLines.filter((line) => line.startsWith("ok"));
      const planLine = tapLines.find((line) => /^1\.\.\d+$/.test(line));
      const planned = planLine ? Number(planLine.slice(3)) : Number.NaN;

      if (!Number.isInteger(planned) || successes.length !== planned || failures.length > 0) {
        if (failures.length > 0) {
          process.stderr.write(`${failures.join("\n")}\n`);
        }
        throw new Error(
          `${testFile} did not pass: plan=${planLine ?? "missing"}, passed=${successes.length}, failed=${failures.length}`,
        );
      }

      totalPlanned += planned;
      totalPassed += successes.length;
      process.stdout.write(`${testFile}: ${successes.length}/${planned} passed\n`);
    }

    process.stdout.write(`pgTAP linked database tests passed: ${totalPassed}/${totalPlanned}\n`);
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
