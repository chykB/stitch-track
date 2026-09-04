import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypescript,

  {
    files: [
      "src/modules/*/domain/**/*.{ts,tsx}",
      "src/shared/domain/**/*.{ts,tsx}",
    ],
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
            {
              name: "zod",
              message:
                "Zod belongs at system boundaries, not in the domain layer.",
            },
            {
              name: "pino",
              message:
                "Domain code must depend on no concrete logging implementation.",
            },
          ],
          patterns: [
            {
              group: [
                "next/**",
                "react/**",
                "zod/**",
                "pino/**",
              ],
              message:
                "Domain code must remain independent from frameworks and boundary libraries.",
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
                "@/shared/application/**",
                "@/shared/validation/**",
                "@/shared/infrastructure/**",
                "@/shared/presentation/**",
                "@/shared/database/**",
                "@/generated/**",
              ],
              message:
                "Domain code must not depend on application, validation, presentation, or infrastructure concerns.",
            },
          ],
        },
      ],
    },
  },

  {
    files: [
      "src/modules/*/application/**/*.{ts,tsx}",
      "src/shared/application/**/*.{ts,tsx}",
    ],
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
            {
              name: "zod",
              message:
                "Application code must receive already validated input instead of depending on Zod.",
            },
            {
              name: "pino",
              message:
                "Application code must depend on ApplicationLogger, not Pino.",
            },
          ],
          patterns: [
            {
              group: [
                "next/**",
                "react/**",
                "zod/**",
                "pino/**",
              ],
              message:
                "Application code must remain independent from presentation frameworks and concrete boundary libraries.",
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
                "@/shared/validation/**",
                "@/shared/infrastructure/**",
                "@/shared/presentation/**",
                "@/shared/database/**",
                "@/generated/**",
              ],
              message:
                "Application code must not access validation implementations, presentation, or infrastructure directly.",
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
      "src/shared/presentation/**/*.{ts,tsx}",
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
            {
              name: "pino",
              message:
                "Presentation code must depend on the application logging abstraction instead of Pino.",
            },
          ],
          patterns: [
            {
              group: ["pino/**"],
              message:
                "Presentation code must not depend directly on Pino.",
            },
            {
              group: [
                "@/modules/*/infrastructure/**",
                "@/shared/infrastructure/**",
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

  {
    files: [
      "src/modules/*/infrastructure/**/*.{ts,tsx}",
      "src/shared/infrastructure/**/*.{ts,tsx}",
      "src/shared/database/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next",
              message:
                "Infrastructure code must not depend on Next.js presentation concerns.",
            },
            {
              name: "react",
              message:
                "Infrastructure code must not depend on React.",
            },
          ],
          patterns: [
            {
              group: ["next/**", "react/**"],
              message:
                "Infrastructure code must remain independent from presentation frameworks.",
            },
            {
              group: [
                "@/modules/*/presentation/**",
                "@/shared/presentation/**",
              ],
              message:
                "Infrastructure code must not depend on presentation.",
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
