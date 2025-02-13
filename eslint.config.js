import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      react: {
        version: "detect", // Automatically detects React version
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off", // Disable rule: no need to import React in JSX files
      "react/jsx-no-target-blank": "off", // Disable rule: no need to warn about target="_blank"
    },
  },
];
