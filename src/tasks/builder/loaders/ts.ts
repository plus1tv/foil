import { gray, yellow } from 'chalk';
import webpack from 'webpack';
import { exec } from 'child_process';
import { statSync, existsSync } from 'fs';
import { join, resolve, isAbsolute } from 'path';
import { database } from '../../../db';
import { Collection } from 'mongodb';
import { config as Config } from '../../../config';

import { Loader } from '../../../types';

import { isProduction } from '../../../env';
import { cyan } from 'chalk';

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

        // Check if main file has been updated or never existed.
        let updated = await checkUpdated(file);

        if (updated) {
            console.log('🟦 TypeScript Transformer:');
            let { dependencies, devDependencies } = require(join(
                foil.meta.rootPath,
                'package.json'
            ));
            if (dependencies || devDependencies) {
                // Update dependencies through `npm i`
                await installDependencies(foil.meta.rootPath);
            }
            // Compile module with Webpack
            await compile(
                join(newFile, '..'),
                './main',
                newMain,
                foil.rootPermalink
            );

            // Update in Database
            await updateInDatabase(newFile, newMain, file);

            let newFoil = {
                ...foil,
                main: newMain
            };

            return newFoil;
        } else return foil;
    }
};

/**
 * Checks the database to see if the file exists or has been updated.
 * If it doesn't exist, or its been updated, return true.
 * @param path The absolute path to the file.
 */
async function checkUpdated(path: string) {
    if (!existsSync(path)) {
        return true;
    }
    return await database.then(async client => {
        let db = client.db('db');

        type RedirectItem = {
            path: string;
            dateModified: string;
        };

        // Check portfolio collection to see if file at path exists.
        type PortfolioItem = {
            meta: {
                files: {
                    path: string;
                    modified: string;
                }[];
            };
        };
        let portfolioCol = db.collection<PortfolioItem>('portfolio');
        let portfolioItems = await portfolioCol
            .find({
                'meta.files.path': path
            })
            .project({
                'meta.files': 1
            })

            .limit(1)
            .toArray();

        if (typeof portfolioItems === 'object' && portfolioItems.length >= 1) {
            // Compare dates
            var { mtime } = statSync(path);
            for (let file of portfolioItems[0].meta.files) {
                if (file.path === path) {
                    return (
                        mtime.getDate() === new Date(file.modified).getDate()
                    );
                }
            }
        }

        // Check redirect collection.
        let redirectCol = db.collection<RedirectItem>('redirect');
        let redirectItems = await redirectCol
            .find({
                to: path
            })
            .limit(1)
            .toArray();

        if (typeof redirectItems === 'object' && redirectItems.length >= 1) {
            // Compare dates
            var { mtime } = statSync(path);
            let hasModified =
                mtime.getDate() ===
                new Date(redirectItems[0].dateModified).getDate();
            return hasModified;
        }
        return true;
    });
}

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
function compile(root: string, main: string, title: string, permalink: string) {
    let config: webpack.Configuration = {
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
            new webpack.DefinePlugin({
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

    var compiler: webpack.Compiler = webpack(config);

    return new Promise<any>((res, rej) =>
        compiler.run((err, stats) => {
            if (err) rej(err);
            else res(stats);
        })
    )
        .then((stats: webpack.Stats) => {
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
