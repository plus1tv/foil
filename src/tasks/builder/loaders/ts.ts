import chalk from 'chalk';
const { cyan, yellow, gray } = chalk;
import Webpack, { Stats, Compiler, Configuration } from 'webpack';
const { webpack, DefinePlugin } = Webpack;
import { exec } from 'child_process';
import { statSync, existsSync } from 'fs';
import { join, resolve, isAbsolute } from 'path';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import remarkMath from 'remark-math';
import hlsl from './misc/hlsl';
import cpp from './misc/cpp';
import wgsl from './misc/wgsl';

import { database } from '../../../db';
import { Collection } from 'mongodb';
import { config as Config } from '../../../config';
import { checkUpdated } from './utils';
import { Loader } from '../../../types';

import { isProduction } from '../../../env';
import { importJson } from '../utils';

const nodeEnvStr: any = isProduction ? 'production' : 'development';

const publicVendorModules = [
    'react',
    'react/jsx-runtime',
    'react-dom',
    'react-router-dom',
    'redux',
    'react-redux',
    'main'
];

export const ts: Loader = {
    test: {
        main: /\.tsx?$/
    },
    transform: async foil => {
        // Get file path
        let file = foil.main;
        if (!isAbsolute(foil.main)) {
            file = join(foil.meta.rootPath, foil.main);
        }
        file.replace(/\\/g, '/');
        let newFile = file.replace(/\.tsx?$/, '.js').replace(/\\/g, '/');
        let newMain = join(foil.rootPermalink, foil.main)
            .replace(/\.tsx?$/, '.js')
            .replace(/\\/g, '/');

        let newFoil = {
            ...foil,
            main: newMain
        };

        // Check if main file has been updated or never existed.
        let updated = await checkUpdated(file);

        if (updated) {
            console.log('🟦 TypeScript Transformer:');
            let { dependencies, devDependencies } = await importJson(
                join(foil.meta.rootPath, 'package.json')
            );
            if (dependencies || devDependencies) {
                // Update dependencies through `npm i`
                await installDependencies(foil.meta.rootPath);
            }
            // Compile module with Webpack
            await compile(join(newFile, '..'), './main', newMain, foil);

            // Update in Database
            await updateInDatabase(newFile, newMain, file);
        }

        return newFoil;
    }
};

/**
 * Downloads dependencies.
 * @param path absolute path to folder of JavaScript file.
 */
function installDependencies(path: string) {
    // Run package manager, install local node_modules
    return new Promise((res, rej) => {
        exec('npm i', { cwd: path }, (err, stdout, _) => {
            console.log('📦 Installing dependencies via NPM.', path);
            if (err) rej(err);
            else res(stdout);
        });
    });
}

/**
 * Compile foil module with Webpack.
 */
function compile(root: string, main: string, title: string, foil: any) {
    let permalink = foil.rootPermalink;

    let config: Configuration = {
        mode: nodeEnvStr,
        context: resolve(root),
        entry: {
            main
        },
        output: {
            path: resolve(root),
            filename: 'main.js',
            libraryTarget: 'system',
            library: {
                type: 'system'
            }
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js'],
            modules: [
                root,
                join(root, 'node_modules'),
                join(Config.currentDir, 'node_modules'),
                join(Config.foilCliRoot, '..', 'node_modules'),
                'node_modules'
            ],
            fallback: {
                crypto: false,
                fs: false,
                path: require.resolve('path-browserify')
            }
        },
        resolveLoader: {
            modules: [
                root,
                join(root, 'node_modules'),
                join(Config.currentDir, 'node_modules'),
                join(Config.foilCliRoot, '..', 'node_modules'),
                'node_modules'
            ]
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                        compilerOptions: {
                            module: 'esnext',
                            sourceMap: !isProduction
                        }
                    }
                },
                {
                    test: /\.wasm$/,

                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        publicPath: permalink
                    }
                },
                {
                    test: /\.mdx$/,
                    use: [
                        {
                            loader: 'ts-loader',
                            options: {
                                transpileOnly: true,
                                compilerOptions: {
                                    module: 'esnext',
                                    sourceMap: !isProduction
                                }
                            }
                        },
                        {
                            loader: '@mdx-js/loader',
                            options: {
                                jsx: false,
                                remarkPlugins: [remarkMath],
                                rehypePlugins: [
                                    rehypeKatex,
                                    [
                                        rehypeHighlight,
                                        {
                                            languages: { hlsl, cpp, wgsl },
                                            aliases: {
                                                msl: 'cpp',
                                                asm: 'x86asm',
                                                amdil: 'x86asm',
                                                ptx: 'x86asm'
                                            }
                                        }
                                    ]
                                ]
                            }
                        }
                    ]
                },

                {
                    test: /\.(wgsl|glsl)$/,
                    type: 'asset/source'
                }
            ]
        },
        node: false,
        externalsType: 'system',
        externals: publicVendorModules,
        externalsPresets: {
            web: true
        },
        plugins: [
            new DefinePlugin({
                'process.env': {
                    NODE_ENV: JSON.stringify(nodeEnvStr)
                }
            })
        ],
        devtool: isProduction ? undefined : 'inline-source-map',
        optimization: {
            minimize: isProduction ? true : false
        }
    };

    console.log(`🔨 Building Module '${cyan(title)}'`);

    var compiler: Compiler = webpack(config);

    return new Promise<any>((res, rej) =>
        compiler.run((err, stats) => {
            if (err) rej(err);
            else res(stats);
        })
    )
        .then((stats: Stats) => {
            if (stats.compilation.errors.length > 0) {
                console.log(
                    yellow(
                        `Build Succeeded with ${stats.compilation.errors.length} errors.\n` +
                            stats.compilation.errors.reduce((prev, cur) => {
                                if (typeof cur === 'object') {
                                    return prev + cur.message + '\n';
                                }
                                return prev + cur + '\n';
                            }, '\n')
                    )
                );
            }
            console.log(
                '🟨 Done in %s ms!\n',
                +stats.endTime - +stats.startTime
            );
        })
        .catch(err => console.error(err));
}

/**
 * Updates the file in the database.
 * @param file absolute file path of module.
 * @param path website path.
 */
function updateInDatabase(file: string, permalink: string, oldFile: string) {
    //index them according to their folder name.
    return database.then(client => {
        let db = client.db('db');
        var filesCollection: Collection = db.collection('redirect');

        let query = {
            from: permalink
        };

        let update = {
            from: permalink,
            to: file,
            dateModified: statSync(oldFile).mtime
        };

        let options = {
            upsert: true
        };

        filesCollection.updateOne(query, { $set: update }, options);

        console.log(gray(`📒 Indexed ${yellow(permalink)}`));
    });
}
