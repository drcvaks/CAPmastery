const { defineConfig, globalIgnores } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");
const globals = require("globals");

module.exports = defineConfig([
  globalIgnores(["dist/*", ".expo/*", "expo-env.d.ts", "types/database.ts"]),
  expoConfig,
  {
    files: ["scripts/**/*.cjs"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: { globals: { ...globals.jest, ...globals.node } },
  },
  eslintPluginPrettierRecommended,
]);
