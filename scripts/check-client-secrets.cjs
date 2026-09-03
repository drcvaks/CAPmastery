const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const path = require("node:path");

const CLIENT_ROOTS = ["app/", "components/", "features/", "hooks/", "lib/", "services/", "types/"];
const CLIENT_FILES = new Set(["app.json"]);
const TEXT_EXTENSIONS = new Set([".js", ".jsx", ".json", ".ts", ".tsx"]);

const checks = [
  {
    label: "a service-role or database secret assigned to an Expo public variable",
    pattern:
      /EXPO_PUBLIC_[A-Z0-9_]*(?:SERVICE_ROLE|DB_PASSWORD|DATABASE_PASSWORD)[A-Z0-9_]*\s*[:=]/i,
  },
  { label: "a Supabase secret-key value", pattern: /\bsb_secret_[A-Za-z0-9_-]{12,}\b/ },
  {
    label: "a JWT-like credential literal",
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  },
];

function trackedClientFiles() {
  const output = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  );
  return output
    .split("\0")
    .filter(Boolean)
    .filter(
      (file) =>
        CLIENT_FILES.has(file) ||
        (CLIENT_ROOTS.some((root) => file.startsWith(root)) &&
          TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())),
    );
}

function findClientSecretRisks(files = trackedClientFiles()) {
  const findings = [];
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const check of checks) {
      if (check.pattern.test(content)) findings.push({ file, risk: check.label });
    }
  }
  return findings;
}

if (require.main === module) {
  const findings = findClientSecretRisks();
  if (findings.length > 0) {
    console.error("Client credential scan failed:");
    for (const finding of findings) console.error(`- ${finding.file}: ${finding.risk}`);
    process.exitCode = 1;
  } else {
    console.log("Client credential scan passed: no privileged credential patterns found.");
  }
}

module.exports = { findClientSecretRisks, trackedClientFiles };
