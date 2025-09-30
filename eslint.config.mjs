import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = __dirname;

const compat = new FlatCompat({
  baseDirectory: projectRoot,
});

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "next-env.d.ts",
      "**/app/generated/prisma/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    settings: {
      next: {
        rootDir: ["."],
      },
    },
  },
];

export default eslintConfig;
