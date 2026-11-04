import shared from "@bugs5382/node-oxlint-config/oxfmt";

export default {
  ...shared,
  ignorePatterns: [
    ...shared.ignorePatterns,
    "dist/**",
    "lib/**",
    "docs/**",
    "coverage/**",
    "temp/**",
    "CLAUDE.md",
    ".github/**",
    ".claude/**",
    "package-lock.json",
  ],
};
