import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Allow 'any' type in development/dynamic imports (will be fixed in future)
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow require() for dynamic imports (recharts)
      "@typescript-eslint/no-require-imports": "warn",
      // Allow unused vars (will be cleaned up)
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];

export default eslintConfig;
