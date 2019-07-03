# root-resolver-plugin

[![Build Status](https://travis-ci.org/jaridmargolin/root-resolver-plugin.svg?branch=master)](https://travis-ci.org/jaridmargolin/root-resolver-plugin)
[![codecov](https://codecov.io/gh/jaridmargolin/root-resolver-plugin/branch/master/graph/badge.svg)](https://codecov.io/gh/jaridmargolin/root-resolver-plugin)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![npm](https://img.shields.io/npm/v/root-resolver-plugin.svg)](https://www.npmjs.com/package/root-resolver-plugin)

_Implementation originally sourced from [webpack-dependency-suite](https://github.com/niieani/webpack-dependency-suite)_

> Resolver plugin to help remove duplicate dependencies caused by `npm link`

This resolver attempts to minimize duplicate dependencies caused by `npm link` by first checking if the dependency can be satisified by a version of the depepndency found in the root of the repo.

For example, when compiling the following application

```
App
├── index.js
└── node_modules
    ├── PKG
    │   ├── index.js
    │   └── node_modules
    │       └── LIB
    └── LIB
```

Using the default resolver, if both `App/index.js` and `PKG/index.js` require `LIB` , multiple versions of `LIB` would be included in your bundle. **RootResolverPlugin** will modify the resolver to search for a `LIB` in the root `node_modules` and check to see if the version satisfies the dependecy defined in `PKG/package.json`.

## Usage

**webpack.config.js**

```
module.exports = {
  ...
  resolve: {
    plugins: [new RootResolverPlugin()]
  }
}
```

## License

The MIT License (MIT) Copyright (c) 2019 - Present Jarid Margolin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
