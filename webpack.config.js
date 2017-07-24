var path = require("path"),
  webpack = require("webpack"),
  cloneDeep = require("lodash.clonedeep");

var ExtractTextPlugin = require("extract-text-webpack-plugin");

config = {
  devtool: "source-map",
  entry: {
    hyphyvision: ["./src/entry.js"],
    vendor: [
      "jquery",
      "jquery-ui-bundle",
      "bootstrap",
      "d3",
      "crossfilter",
      "dc",
      "immutable",
      "underscore",
      "phylotree",
      "react"
    ]
  },
  output: {
    path: path.resolve(__dirname, "dist/"),
    filename: "[name].js"
  },
  externals: {
    jsdom: "window"
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)?$/,
        exclude: /node_modules/,
        loaders: "babel-loader",
        query: {
          presets: ["react"]
        }
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        })
      },
      {
        test: require.resolve("jquery"),
        use: [
          {
            loader: "expose-loader",
            query: "jQuery"
          },
          {
            loader: "expose-loader",
            query: "$"
          }
        ]
      },
      {
        test: require.resolve("d3"),
        use: [
          {
            loader: "expose-loader",
            query: "d3"
          }
        ]
      },
      {
        test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url-loader",
        options: { limit: 10000, mimetype: "application/font-woff" }
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url-loader",
        options: { limit: 10000, mimetype: "application/octet-stream" }
      },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loaders: "file-loader" },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loaders: "url-loader",
        options: { limit: 10000, mimetype: "image/svg+xml" }
      },
      {
        test: /\.(js|jsx)?$/,
        exclude: /node_modules/,
        loader: "eslint-loader",
        options: {}
      },
      {
        test: /\.less?$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: ["css-loader", "less-loader"]
        })
      },
      {
        test: /\.glsl$/,
        loader: "webpack-glsl-loader"
      },
			{
        test: /node_modules/,
        loader: 'ify-loader'
			}
    ]
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({ debug: true }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "vendor",
      filename: "vendor.js"
    }),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      d3: "d3",
      crossfilter: "crossfilter",
      dc: "dc",
      datamonkey: "datamonkey",
      _: "underscore"
    }),
    new webpack.IgnorePlugin(/jsdom$/),
    new ExtractTextPlugin("[name].css")
  ],
  resolve: {
    alias: {
      dc: __dirname + "/node_modules/dc/dc.min.js",
      "dc.css": __dirname + "/node_modules/dc/dc.min.css",
      "phylotree.css": __dirname + "/node_modules/phylotree/phylotree.css"
    },
    modules: ["src", "node_modules"],
    extensions: [".json", ".js", ".jsx", ".less"]
  }
};

if (process.env.NODE_ENV === "production") {
  config.devtool = false;
  config.debug = false;
  config.plugins.push(new webpack.optimize.OccurrenceOrderPlugin());
  config.plugins.push(new webpack.optimize.UglifyJsPlugin());
}

module.exports = [config];
