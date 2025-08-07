const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional asset extensions
config.resolver.assetExts.push(
  // Audio formats
  'wav',
  'mp3',
  'aac',
  'm4a',
  // Document formats
  'pdf',
  'doc',
  'docx',
  // Font formats
  'ttf',
  'otf',
  'woff',
  'woff2'
);

// Configure source extensions
config.resolver.sourceExts.push(
  'jsx',
  'js',
  'ts',
  'tsx',
  'json'
);

// Configure module resolution
config.resolver.alias = {
  '@': './src',
  '@/components': './src/components',
  '@/screens': './src/screens',
  '@/services': './src/services',
  '@/store': './src/store',
  '@/config': './src/config',
  '@/types': './src/types',
  '@/utils': './src/utils'
};

module.exports = config;