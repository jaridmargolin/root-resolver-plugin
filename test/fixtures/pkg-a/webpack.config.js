'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// 3rd party
const path = require('path')

// lib
const RootResolverPlugin = require('../../../lib')

/* -----------------------------------------------------------------------------
 * webpack config
 * -------------------------------------------------------------------------- */

module.exports = {
  mode: 'production',
  entry: './index.js',
  target: 'node',
  output: {
    path: path.resolve('./'),
    filename: 'dist.js',
    library: 'pkgA',
    libraryTarget: 'umd'
  },
  resolve: {
    plugins: [new RootResolverPlugin()]
  }
}
