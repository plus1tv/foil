import { resolve } from 'path';
import { ConcatSource } from 'webpack-sources';
import { camelcase as toCamelCase } from 'varname';
import { Compiler, Compilation, javascript } from 'webpack';
const { JavascriptModulesPlugin } = javascript;
import { writeFile } from 'fs';

type SystemRegisterOptions = {
    registerName?: string;
    minify?: boolean;
    systemjsDeps?: (string | RegExp)[];
    publicPath?: {
        useSystemJSLocateDir: boolean;
    };
};

const PLUGIN_NAME = 'WebpackSystemRegister';

/**
 * Updated to work with Webpack v5
 * https://github.com/CanopyTax/webpack-system-register
 */
export default class WebpackSystemRegister {
    options: SystemRegisterOptions;
    constructor(options: SystemRegisterOptions) {
        if (typeof options !== 'object')
            throw new Error(
                'webpack-system-register takes exactly one argument (pass an options object)'
            );

        this.options = {
            registerName: null,
            minify: false,
            systemjsDeps: [],
            publicPath: {
                useSystemJSLocateDir: false
            },
            ...options
        };

        if (!Array.isArray(this.options.systemjsDeps))
            throw new Error(
                `webpack-system-register requires that systemjsDeps is an array of strings`
            );

        if (
            this.options.publicPath.useSystemJSLocateDir &&
            typeof this.options.registerName !== 'string'
        ) {
            throw new Error(
                `webpack-system-register requires opts.registerName when opts.publicPath.useSystemJSLocateDir is truthy`
            );
        }
    }

    apply(compiler: Compiler) {
        const options = this.options;

        if (
            compiler.options.output.publicPath &&
            options.publicPath.useSystemJSLocateDir
        ) {
            throw new Error(
                `webpack-system-register -- should not set webpack output.publicPath while simultaneously setting webpack-system-register's opts.publicPath`
            );
        }

        options.systemjsDeps = (options.systemjsDeps || []).map(depName => {
            if (typeof depName === 'string') {
                // literal string match, as a regular expression
                return new RegExp(`^${depName}$`);
            } else if (depName instanceof RegExp) {
                return depName;
            } else {
                throw new Error(
                    `systemJsDeps must either be a string or a regular expression`
                );
            }
        });

        const externalModuleFiles = [];
        const externalModules = [];

        if (!compiler.options.resolve) {
            compiler.options.resolve = {};
        }

        if (!compiler.options.resolve.alias) {
            compiler.options.resolve.alias = {};
        }

        compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, nmf => {
            // https://github.com/webpack/webpack/blob/c181294865dca01b28e6e316636fef5f2aad4eb6/lib/NormalModuleReplacementPlugin.js
            nmf.hooks.beforeResolve.tap(PLUGIN_NAME, result => {
                if (
                    options.systemjsDeps.find(dep =>
                        new RegExp(dep).test(result.request)
                    )
                ) {
                    const originalRequest = '' + result.request;
                    const filename = `node_modules/__${toJsVarName(
                        result.request
                    )}`;
                    if (!externalModuleFiles.includes(filename)) {
                        externalModuleFiles.push(filename);
                        writeFile(
                            filename,
                            `module.exports = ${toJsVarName(originalRequest)};`,
                            err => {
                                if (err) {
                                    console.error(err);
                                    throw err;
                                }

                                externalModules.push({
                                    depFullPath: originalRequest,
                                    depVarName: toJsVarName(originalRequest)
                                });
                                result.request = resolve(
                                    process.cwd(),
                                    filename
                                );
                                return;
                            }
                        );
                    }
                    result.request = resolve(process.cwd(), filename);
                }
            });
            nmf.hooks.afterResolve.tap(PLUGIN_NAME, result => {
                if (
                    options.systemjsDeps.find(dep =>
                        new RegExp(dep).test(result.request)
                    )
                ) {
                    result['resource'] = resolve(
                        process.cwd(),
                        `__${toJsVarName(result.request)}`
                    );
                }
            });
        });

        compiler.hooks.compilation.tap(
            PLUGIN_NAME,
            (compilation, { normalModuleFactory }) => {
                // Can't override the __webpack_require__.p via plugin because of https://github.com/webpack/webpack/blob/1b459d91f56215a3c617373d456ad53f9a63fea3/lib/MainTemplate.js#L99
                if (options.publicPath.useSystemJSLocateDir) {
                    compilation.mainTemplate.hooks.requireExtensions.tap(
                        PLUGIN_NAME,
                        (source, chunk, hash) =>
                            source.replace(
                                /__webpack_require__\.p = \".*\";/,
                                '__webpack_require__.p = $__wsr__public__path;'
                            )
                    );
                }

                // http://stackoverflow.com/questions/35092183/webpack-plugin-how-can-i-modify-and-re-parse-a-module-after-compilation
                // https://github.com/webpack/webpack/blob/c181294865dca01b28e6e316636fef5f2aad4eb6/lib/EvalDevToolModulePlugin.js#L44
                {
                    const hooks =
                        JavascriptModulesPlugin.getCompilationHooks(
                            compilation
                        );
                    hooks.renderModuleContent.tap(
                        PLUGIN_NAME,
                        (source, module) => {
                            let isEntry =
                                compilation.chunkGraph.isEntryModule(module);
                            let isHarmonyModule = module.buildMeta
                                ? module.buildMeta.exportsType === 'namespace'
                                : module.buildMeta &&
                                  module.buildMeta.harmonyModule;
                            let exportsArgument = 'exports';

                            if (isHarmonyModule) {
                                exportsArgument = '__webpack_exports__';
                            }

                            if (isEntry) {
                                const content = source.source();
                                source = new ConcatSource(
                                    content,
                                    `\n$__register__main__exports(${exportsArgument});`
                                );
                            }

                            return source;
                        }
                    );
                }

                // Based on https://github.com/webpack/webpack/blob/ded70aef28af38d1deb2ac8ce1d4c7550779963f/lib/WebpackSystemRegister.js
                compilation.hooks.processAssets.tap(
                    {
                        name: PLUGIN_NAME,
                        stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
                    },
                    _compilationAssets => {
                        compilation.chunks.forEach(chunk => {
                            if (!chunk.isOnlyInitial()) {
                                return;
                            }

                            chunk.files.forEach(file => {
                                compilation.updateAsset(
                                    file,
                                    old =>
                                        new ConcatSource(
                                            sysRegisterStart(
                                                options,
                                                externalModules
                                            ),
                                            old,
                                            sysRegisterEnd(options)
                                        )
                                );
                            });
                        });
                    }
                );
            }
        );
    }
}

function sysRegisterStart(opts, externalModules): string {
    let result = `System.register(${registerName()}${depsList()}, function($__export) {
  ${
      externalModules.length > 0
          ? `var ${externalModules
                .map(toDepVarName)
                .map(toCommaSeparatedList)
                .reduce(toString, '')};`
          : ``
  }
${
    opts.publicPath.useSystemJSLocateDir
        ? `
  /* potentially the first load is always the one we're interested in??? if so .find should short circuit anyway so no perf probs */
  var $__wsr__load = SystemJS._loader.loads.find(function(load) {
    return load.name === SystemJS.normalizeSync('${opts.registerName}');
  });

  if (!$__wsr__load) {
    throw new Error("webpack-system-register plugin cannot correctly set webpack's publicPath, since there is no current SystemJS load for " + SystemJS.normalizeSync('${opts.registerName}'))
  }

  var $__wsr__public__path = $__wsr__load.address.substring(0, $__wsr__load.address.lastIndexOf('/') + 1);`
        : ``
}

  function $__register__main__exports(exports) {
    for (var exportName in exports) {
	  $__export(exportName, exports[exportName]);
    }
  }

  function $__wsr__interop(m) {
	return m.__useDefault ? m.default : m;
  }

  return {
    setters: [${externalModules
        .map(toDepVarName)
        .map(toSetters.bind(null, opts))
        .reduce(toString, '')}
    ],
    execute: function() {
`;
    return opts.minify ? minify(result) : result;

    function registerName(): string {
        return opts.registerName ? `'${opts.registerName}', ` : '';
    }

    function depsList(): string {
        return `[${externalModules
            .map(toDepFullPath)
            .map(toStringLiteral)
            .map(toCommaSeparatedList)
            .reduce(toString, '')}]`;
    }

    function toCommaSeparatedList(name, i) {
        return `${i > 0 ? ', ' : ''}${name}`;
    }

    function toSetters(opts, name, i) {
        // webpack needs the __esModule flag to know how to do it's interop require default func
        const result = `${i > 0 ? ',' : ''}
      function(m) {
        ${name} = $__wsr__interop(m);
      }`;

        return opts.minify ? minify(result) : result;
    }

    function toStringLiteral(str) {
        return `'${str}'`;
    }

    function toString(prev, next) {
        return prev + next;
    }
}

function sysRegisterEnd(opts): string {
    const result = `
    }
  }
});
`;
    return opts.minify ? minify(result) : result;
}

function toJsVarName(systemJsImportName): string {
    return toCamelCase(removeSlashes(moduleName(systemJsImportName)));
}

function moduleName(systemJsImportName): string {
    return systemJsImportName.includes('!')
        ? systemJsImportName.slice(0, systemJsImportName.indexOf('!'))
        : systemJsImportName;
}

function removeSlashes(systemJsImportName): string {
    return systemJsImportName.replace('/', '');
}

function toDepVarName({ depVarName }): string {
    return depVarName;
}

function toDepFullPath({ depFullPath }): string {
    return depFullPath;
}

function minify(string): string {
    return string.replace(/\n/g, '');
}
