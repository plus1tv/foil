"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ts = void 0;
const chalk_1 = require("chalk");
const webpack_1 = __importDefault(require("webpack"));
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const db_1 = require("../../../db");
const config_1 = require("../../../config");
const utils_1 = require("./utils");
const env_1 = require("../../../env");
const chalk_2 = require("chalk");
const nodeEnvStr = env_1.isProduction ? 'production' : 'development';
const publicVendorModules = [
    'react',
    'react/jsx-runtime',
    'react-dom',
    'react-router-dom',
    'redux',
    'react-redux',
    'main'
];
exports.ts = {
    test: {
        main: /\.tsx?$/
    },
    transform: (foil) => __awaiter(void 0, void 0, void 0, function* () {
        let file = foil.main;
        if (!(0, path_1.isAbsolute)(foil.main)) {
            file = (0, path_1.join)(foil.meta.rootPath, foil.main);
        }
        file.replace(/\\/g, '/');
        let newFile = file.replace(/\.tsx?$/, '.js').replace(/\\/g, '/');
        let newMain = (0, path_1.join)(foil.rootPermalink, foil.main)
            .replace(/\.tsx?$/, '.js')
            .replace(/\\/g, '/');
        let updated = yield (0, utils_1.checkUpdated)(file);
        if (updated) {
            console.log('🟦 TypeScript Transformer:');
            let { dependencies, devDependencies } = require((0, path_1.join)(foil.meta.rootPath, 'package.json'));
            if (dependencies || devDependencies) {
                yield installDependencies(foil.meta.rootPath);
            }
            yield compile((0, path_1.join)(newFile, '..'), './main', newMain, foil.rootPermalink);
            yield updateInDatabase(newFile, newMain, file);
            let newFoil = Object.assign(Object.assign({}, foil), { main: newMain });
            return newFoil;
        }
        return foil;
    })
};
function installDependencies(path) {
    return new Promise((res, rej) => {
        (0, child_process_1.exec)('npm i', { cwd: path }, (err, stdout, _) => {
            console.log('📦 Installing dependencies via NPM.', path);
            if (err)
                rej(err);
            else
                res(stdout);
        });
    });
}
function compile(root, main, title, permalink) {
    let config = {
        mode: nodeEnvStr,
        context: (0, path_1.resolve)(root),
        entry: {
            main
        },
        output: {
            path: (0, path_1.resolve)(root),
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
                (0, path_1.join)(root, 'node_modules'),
                (0, path_1.join)(config_1.config.currentDir, 'node_modules'),
                (0, path_1.join)(config_1.config.foilCliRoot, '..', 'node_modules'),
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
                (0, path_1.join)(root, 'node_modules'),
                (0, path_1.join)(config_1.config.currentDir, 'node_modules'),
                (0, path_1.join)(config_1.config.foilCliRoot, '..', 'node_modules'),
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
                            sourceMap: !env_1.isProduction
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
            new webpack_1.default.DefinePlugin({
                'process.env': {
                    NODE_ENV: JSON.stringify(nodeEnvStr)
                }
            })
        ],
        devtool: env_1.isProduction ? undefined : 'inline-source-map',
        optimization: {
            minimize: env_1.isProduction ? true : false
        }
    };
    console.log(`🔨 Building Module '${(0, chalk_2.cyan)(title)}'`);
    var compiler = (0, webpack_1.default)(config);
    return new Promise((res, rej) => compiler.run((err, stats) => {
        if (err)
            rej(err);
        else
            res(stats);
    }))
        .then((stats) => {
        if (stats.compilation.errors.length > 0) {
            console.log((0, chalk_1.yellow)(`Build Succeeded with ${stats.compilation.errors.length} errors.\n` +
                stats.compilation.errors.reduce((prev, cur) => {
                    if (typeof cur === 'object') {
                        return prev + cur.message + '\n';
                    }
                    return prev + cur + '\n';
                }, '\n')));
        }
        console.log('🟨 Done in %s ms!\n', +stats.endTime - +stats.startTime);
    })
        .catch(err => console.error(err));
}
function updateInDatabase(file, permalink, oldFile) {
    return db_1.database.then(client => {
        let db = client.db('db');
        var filesCollection = db.collection('redirect');
        let query = {
            from: permalink
        };
        let update = {
            from: permalink,
            to: file,
            dateModified: (0, fs_1.statSync)(oldFile).mtime
        };
        let options = {
            upsert: true
        };
        filesCollection.updateOne(query, { $set: update }, options);
        console.log((0, chalk_1.gray)(`📒 Indexed ${(0, chalk_1.yellow)(permalink)}`));
    });
}
//# sourceMappingURL=ts.js.map