// import { DefinePlugin } from "webpack";
const webpack = require('webpack');
const path = require('path');
module.exports = {

  plugins: [
    new webpack.DefinePlugin({ "global.GENTLY": false })
  ],
  // externals: {
  //   sqlite3: 'commonjs sqlite3',
  // },

  // https://github.com/typeorm/typeorm/issues/413#issuecomment-479459555
  externals: {sqlite3: "require('sqlite3')"},
  resolve: {
    alias: {
      sqlite3: path.resolve(__dirname, "../node_modules/sqlite3/sqlite3")
    }
  },
  // externals: ['electron','sqlite3'],
  optimization: {
    // Allow TypeORM to correctly find references to entities
    // Really, just need to not minify the class name
    minimize: false
  }
};