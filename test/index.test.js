'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// core
const path = require('path')

// 3rd party
const webpack = require('webpack')

/* -----------------------------------------------------------------------------
 * test
 * -------------------------------------------------------------------------- */

beforeAll(
  () =>
    new Promise((resolve, reject) => {
      const curCwd = process.cwd()
      process.chdir(path.join(__dirname, './fixtures/pkg-a'))

      webpack(require('./fixtures/pkg-a/webpack.config'), (err, stats) => {
        process.chdir(curCwd)
        return err || stats.hasErrors()
          ? reject(err || stats.hasErrors())
          : resolve()
      })
    })
)

test('Should resolve to the same module if semver intersects', () => {
  // lib
  const { pkgB, semverMatch } = require('./fixtures/pkg-a/dist.js')
  expect(pkgB.semverMatch).toBe(semverMatch)
})

test('Should resolve to the same module if hash matches', () => {
  const { pkgB, strMatch } = require('./fixtures/pkg-a/dist.js')
  expect(pkgB.strMatch).toBe(strMatch)
})

// TODO: Based on the resolution strategy of this module, this case is not
// possible to solve. This means any module shared between B and C must be
// declared by A in order to dedupe.
// test('Should resolve to the same module if dependency matches outside root', () => {
//   const { pkgB, semverMatchNotRoot } = require('./fixtures/pkg-a/dist.js')
//   expect(pkgB.semverMatchNotRoot).toBe(pkgC.semverMatchNotRoot)
// })

test('Should resolve to different modules if semver does not intersect', () => {
  const { pkgB, noMatch } = require('./fixtures/pkg-a/dist.js')
  expect(pkgB.noMatch).not.toBe(noMatch)
})
