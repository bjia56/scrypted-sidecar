const path = require('path');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      },
    ],
  },
  resolve: {
    extensions: [ '.ts', '.js' ],
  },
  target: "web",
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public/dist'),
  },
};