'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// core
const path = require('path')

// 3rd party
const debug = require('debug')
const semver = require('semver')
const { get } = require('lodash')
const { hashElement } = require('folder-hash')

/* -----------------------------------------------------------------------------
 * helpers
 * -------------------------------------------------------------------------- */

const print = debug('root-resolver-plugin')
const logPkg = pkgName => {
  let logs = pkgName

  const log = str => (logs += `\n├── ${str}`)
  log.print = (...strs) => {
    strs.forEach(str => log(str))
    print(logs)
  }

  return log
}

const hashRequest = req =>
  hashElement(req.descriptionFileRoot, {
    files: { exclude: ['package.json'] }
  })

const getDependencyVersion = (packageJson, packageName) => {
  // handle internal imports from es moudles
  if (packageName === packageJson.name) {
    return packageJson.version
  }

  return (
    get(packageJson, ['dependencies', packageName]) ||
    get(packageJson, ['devDependencies', packageName]) ||
    get(packageJson, ['optionalDependencies', packageName]) ||
    get(packageJson, ['peerDependencies', packageName])
  )
}

/* -----------------------------------------------------------------------------
 * RootResolverPlugin
 * -------------------------------------------------------------------------- */

class RootResolverPlugin {
  constructor ({ rootDir = process.cwd(), overwrite = [] } = {}) {
    this.rootDir = rootDir
    this.overwrite = overwrite
  }

  apply (resolver) {
    const { rootDir, overwrite } = this
    var target = resolver.ensureHook('resolve')

    resolver
      .getHook('resolved')
      .tapAsync('RootResolverPlugin', async (request, context, callback) => {
        // avoid infinitie loop
        if (request.context['fromRootResolver']) {
          return callback(null, request)
        }

        const relativeToRoot = path.relative(rootDir, request.path)
        const previousPathParts = request.path.split(path.sep)
        const nodeModulesCount = previousPathParts.filter(
          p => p === 'node_modules'
        ).length

        if (!relativeToRoot.includes(`..`) && nodeModulesCount <= 1) {
          return callback(null, request)
        }

        const lastNodeModulesAt = previousPathParts.lastIndexOf('node_modules')
        const actualRequestPath = previousPathParts
          .slice(lastNodeModulesAt + 1)
          .join('/')

        if (!request.context || !request.context.issuer) {
          return callback(null, request)
        }

        const issuer = await new Promise(resolve => {
          const { issuer } = request.context
          resolver.doResolve(
            target,
            {
              path: '/',
              request: issuer,
              context: { fromRootResolver: true }
            },
            `resolve issuer of ${request.path}`,
            context,
            (err, value) => (err ? resolve() : resolve(value))
          )
        })

        if (!issuer) {
          return callback(null, request)
        }

        const resolvedInParentContext = await new Promise(resolve =>
          resolver.doResolve(
            target,
            { context: {}, path: rootDir, request: actualRequestPath },
            `resolve ${actualRequestPath} in ${rootDir}`,
            context,
            (err, value) => (err ? resolve() : resolve(value))
          )
        )

        if (!resolvedInParentContext) {
          return callback(null, request)
        }

        const resolvedVersion =
          resolvedInParentContext.descriptionFileData &&
          resolvedInParentContext.descriptionFileData.version
        const packageName =
          resolvedInParentContext.descriptionFileData &&
          resolvedInParentContext.descriptionFileData.name
        const allowedRange = getDependencyVersion(
          issuer.descriptionFileData,
          packageName
        )
        const isValidRange = allowedRange && semver.validRange(allowedRange)

        let log = logPkg(`${packageName}`)

        const noRewrite = reason => {
          log.print(reason, `NOT REWRITING`)
          return callback(null, request)
        }

        const rewrite = reason => {
          log.print(
            reason,
            `REWRITING: ${relativeToRoot} -> ${actualRequestPath}`
          )
          return callback(null, resolvedInParentContext)
        }

        if (!resolvedVersion || !allowedRange) {
          return noRewrite(
            `CANNOT ANALYZE: ${allowedRange} -> ${resolvedVersion}`
          )
        }

        log(`ANALYZING: ${allowedRange} -> ${resolvedVersion}`)

        if (overwrite[packageName]) {
          return rewrite(`OVERWRITE DEFINED`)
        }

        if (!isValidRange) {
          const hashedParent = await hashRequest(resolvedInParentContext)
          const hashedCurrent = await hashRequest(request)

          return hashedParent.hash === hashedCurrent.hash
            ? rewrite(`DEPENDECY HASH MATCHED`)
            : noRewrite(`INVALID SEMVER RANGE`)
        }

        return semver.satisfies(resolvedVersion, allowedRange, true)
          ? rewrite(`SEMVER SATISFIED`)
          : noRewrite(`SEMVER NOT SATISFIED`)
      })
  }
}

module.exports = RootResolverPlugin
