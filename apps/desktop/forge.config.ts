import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';

import mainConfig from './webpack.main.config';
import rendererConfig from './webpack.renderer.config';

const { FuseV1Options, FuseVersion } = require('@electron/fuses') as {
  FuseV1Options: {
    EnableCookieEncryption: number;
    EnableEmbeddedAsarIntegrityValidation: number;
    EnableNodeCliInspectArguments: number;
    EnableNodeOptionsEnvironmentVariable: number;
    OnlyLoadAppFromAsar: number;
    RunAsNode: number;
  };
  FuseVersion: { V1: string };
};

const config = {
  packagerConfig: {
    asar: true,
    download: {
      // Electron is pinned, so keep its official release checksums with the package config.
      // This preserves checksum validation when the release manifest is temporarily unreachable.
      checksums: {
        'electron-v44.2.0-darwin-arm64.zip':
          'f906dff5d054b1b92e5711781b13cc206fd7139ce66467503b9d0a3e6fbc9b02',
        'electron-v44.2.0-darwin-x64.zip':
          '0c58057eebd23859389e2eba1555975bcbc8adebcc5aa97ff36c036125e2b21a',
        'electron-v44.2.0-linux-arm64.zip':
          '8693fd67332d417775dc2ffc470f4c05eda9d0ed1ac329e4866e108afaa4ddda',
        'electron-v44.2.0-linux-x64.zip':
          '574f7d8cd2a82d77812849729a282b86639b050de120d58b138a126d16b48692',
        'electron-v44.2.0-mas-arm64.zip':
          '91eb10e13656e1a2e312470e9c2ad895085f66e9feb4c462ab49f6db694c6b94',
        'electron-v44.2.0-mas-x64.zip':
          '24b918a0d8c9f4904facb34df1a342cf07da56ab7ec72ddc66043b46e65f6fe3',
        'electron-v44.2.0-win32-arm64.zip':
          'a753799aaf4e01262c2f103ef38c0349c9d3370069becc53f9276a5773891427',
        'electron-v44.2.0-win32-x64.zip':
          '4021363e3090d67a144ebedb90765cf193b0e61f300c519c83f0174502a481da',
      },
    },
  },
  plugins: [
    new WebpackPlugin({
      mainConfig,
      port: 3001,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/renderer/index.html',
            js: './src/renderer/index.tsx',
            name: 'main_window',
            preload: {
              js: './src/preload/index.ts',
            },
          },
        ],
      },
    }),
    new FusesPlugin({
      version: FuseVersion.V1 as never,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
