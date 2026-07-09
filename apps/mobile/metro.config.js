// Metro config for the Expo app inside the FastTarot monorepo.
// Adds the repo root to the watch folders and enables resolution of the shared
// `@fasttarot/core` package (and hoisted node_modules) from apps/mobile.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..', '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the whole monorepo so changes in packages/core are picked up.
config.watchFolders = [monorepoRoot];

// 2. Resolve modules from both the app and the hoisted root node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Let Metro import the shared core (TS source) and card JSON directly.
config.resolver.extraNodeModules = {
  '@fasttarot/core': path.resolve(monorepoRoot, 'packages/core'),
};

module.exports = config;
