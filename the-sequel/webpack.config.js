const path = require("path");
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


module.exports = {
	mode: process.env.NODE_ENV,
  entry: {
    "main": "./src/index.ts",
    // Package each language's worker and give these filenames in `getWorkerUrl`
    "editor.worker": 'monaco-editor/esm/vs/editor/editor.worker.js',
    "json.worker": 'monaco-editor/esm/vs/language/json/json.worker',
    // "css.worker": 'monaco-editor/esm/vs/language/css/css.worker',
    // "html.worker": 'monaco-editor/esm/vs/language/html/html.worker',
    // "ts.worker": 'monaco-editor/esm/vs/language/typescript/ts.worker',
  },
	output: {
    globalObject: 'self',
		path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    library: 'theSequel',
    libraryTarget: 'umd'
	},
	module: {
		rules: [
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          {
              loader: "ts-loader"
          }
        ]
      },
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader"
      },
      {
        test: /\.(js|jsx)$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ['@babel/preset-env']
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader",],
      }, {
        test: /\.ttf$/,
        loader: 'file-loader',
        options: {
          name: '[name].[contenthash].[ext]',
          outputPath: 'static/font',
          publicPath: `https://assets.narrator.ai/the-sequel/font`,
        }
      }
    ],
  },
  externals: {
    react: {
      root: 'React',
      amd: 'react',
      commonjs: 'react',
      commonjs2: 'react',
      umd: 'react',
    },
    "react-dom": {
      root: 'ReactDOM',
      amd: 'react-dom',
      commonjs: 'react-dom',
      commonjs2: 'react-dom',
      umd: 'react-dom',
    },
    "react-dom/server": {
      amd: 'react-dom/server',
      commonjs: 'react-dom/server',
      commonjs2: 'react-dom/server',
      umd: 'react-dom/server',
    }
  },
	plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      // need to limit to only one chunk for everything to work properly
      maxChunks: 1,
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    })
  ],
  resolve: {
    extensions: [".jsx", ".js", ".tsx", ".ts"]
  },
};
