const fs = require('fs');

// Update tsconfig.json
let tsconfigStr = fs.readFileSync('tsconfig.json', 'utf8');
const newPaths = `"paths": {
      "@/*": ["src/*"],
      "@app/*": ["src/app/*"],
      "@modules/*": ["src/modules/*"],
      "@shared/*": ["src/shared/*"],
      "@components/*": ["src/shared/components/*"],
      "@common/*": ["src/shared/components/common/*"],
      "@features/*": ["src/modules/*"],
      "@lib/*": ["src/shared/utils/*", "src/shared/services/*"],
      "@services/*": ["src/shared/services/*"],
      "@domain/*": ["src/shared/services/*"],
      "@config/*": ["src/shared/utils/config/*"],
      "@data/*": ["data/*"]
    }`;
tsconfigStr = tsconfigStr.replace(/"paths"[\s\S]*?\}/, newPaths);
fs.writeFileSync('tsconfig.json', tsconfigStr);

// Update vite.config.ts
let viteStr = fs.readFileSync('vite.config.ts', 'utf8');
const newAlias = `alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@components': path.resolve(__dirname, './src/shared/components'),
      '@common': path.resolve(__dirname, './src/shared/components/common'),
      '@features': path.resolve(__dirname, './src/modules'),
      '@lib': path.resolve(__dirname, './src/shared/utils'),
      '@services': path.resolve(__dirname, './src/shared/services'),
      '@domain': path.resolve(__dirname, './src/shared/services'),
      '@config': path.resolve(__dirname, './src/shared/utils/config'),
      '@data': path.resolve(__dirname, './data'),
    }`;
viteStr = viteStr.replace(/alias:\s*\{[\s\S]*?\}/, newAlias);
fs.writeFileSync('vite.config.ts', viteStr);

console.log('Configs updated!');
