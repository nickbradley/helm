module.exports = {
  externals: {
    sqlite3: 'commonjs sqlite3',
  },
  optimization: {
    // Allow TypeORM to correctly find references to entities
    // Really, just need to not minify the class name
    minimize: false
  }
};