import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "web");

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
      "web/next-env.d.ts",
      "**/app/generated/prisma/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    settings: {
      next: {
        rootDir: ["web"],
      },
    },
  },
];

export default eslintConfig;
