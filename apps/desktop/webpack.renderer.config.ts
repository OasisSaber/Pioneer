import HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Compiler, Configuration } from 'webpack';

const PACKAGED_CONTENT_SECURITY_POLICY =
  "default-src 'self'; script-src 'self'; connect-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";

class PackagedCspMetaPlugin {
  apply(compiler: Compiler): void {
    compiler.hooks.thisCompilation.tap(
      'PackagedCspMetaPlugin',
      (compilation) => {
        HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tap(
          'PackagedCspMetaPlugin',
          (data) => {
            if (
              compiler.options.mode !== 'production' ||
              !data.outputName.endsWith('/index.html')
            )
              return data;
            const meta = `<meta http-equiv="Content-Security-Policy" content="${PACKAGED_CONTENT_SECURITY_POLICY}" />`;
            if (!data.html.includes(meta))
              data.html = data.html.replace('</head>', `  ${meta}</head>`);
            return data;
          },
        );
      },
    );
  }
}

const config: Configuration = {
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [new PackagedCspMetaPlugin()],
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
};

export default config;
