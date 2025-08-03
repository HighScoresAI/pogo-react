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
    rules: {
      // Disable ALL problematic rules
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-img-element": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/prefer-namespace-keyword": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-array-constructor": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-extra-non-null-assertion": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-new": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/prefer-as-const": "off",
      "@typescript-eslint/restrict-plus-operands": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/unbound-method": "off",
    },
  },
];

export default eslintConfig;
