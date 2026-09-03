import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypescript,

  {
    files: ["src/modules/*/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next",
              message: "Domain code must not depend on Next.js.",
            },
            {
              name: "react",
              message: "Domain code must not depend on React.",
            },
            {
              name: "@prisma/client",
              message: "Prisma belongs to the infrastructure layer.",
            },
          ],
          patterns: [
            {
              group: ["next/**", "react/**"],
              message:
                "Domain code must remain independent from framework libraries.",
            },
            {
              group: [
                "@/modules/*/application/**",
                "@/modules/*/infrastructure/**",
                "@/modules/*/presentation/**",
              ],
              message:
                "Domain code must not depend on outer application layers.",
            },
            {
              group: [
                "@/shared/database/**",
                "@/generated/**",
              ],
              message:
                "Domain code must not access database infrastructure.",
            },
          ],
        },
      ],
    },
  },

  {
    files: ["src/modules/*/application/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next",
              message: "Application code must not depend on Next.js.",
            },
            {
              name: "react",
              message: "Application code must not depend on React.",
            },
            {
              name: "@prisma/client",
              message:
                "Application code must depend on repository interfaces, not Prisma.",
            },
          ],
          patterns: [
            {
              group: ["next/**", "react/**"],
              message:
                "Application code must remain independent from presentation frameworks.",
            },
            {
              group: [
                "@/modules/*/infrastructure/**",
                "@/modules/*/presentation/**",
              ],
              message:
                "Application code must not depend on infrastructure or presentation.",
            },
            {
              group: [
                "@/shared/database/**",
                "@/generated/**",
              ],
              message:
                "Application code must not access database infrastructure directly.",
            },
          ],
        },
      ],
    },
  },

  {
    files: [
      "src/app/**/*.{ts,tsx}",
      "src/modules/*/presentation/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message:
                "Presentation code must call application use cases instead of Prisma.",
            },
          ],
          patterns: [
            {
              group: [
                "@/modules/*/infrastructure/**",
                "@/shared/database/**",
                "@/generated/**",
              ],
              message:
                "Presentation code must not access infrastructure directly.",
            },
          ],
        },
      ],
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
