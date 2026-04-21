import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Type-aware rules — requires parserOptions.project so the TS compiler can
  // resolve types for every file. Slightly slower than non-type-checked rules
  // but catches a whole class of runtime errors at lint time.
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // React async event handlers (onClick={asyncFn}) return Promise<void>
      // where the DOM expects void. This is idiomatic in React and safe —
      // React ignores the returned promise. Disable the attribute check only.
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      // Allow _-prefixed identifiers to be declared without being used.
      // This is the conventional way to mark intentionally unused destructured
      // bindings (e.g. `const { foo: _foo, ...rest } = obj`).
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Plain JS config files — not part of the TS project, cannot be type-checked
    "eslint.config.mjs",
    "postcss.config.mjs",
    "commitlint.config.js",
  ]),
]);

export default eslintConfig;
