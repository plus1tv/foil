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
exports.blog = void 0;
const markademic_1 = __importDefault(require("markademic"));
const path_1 = require("path");
const fs_1 = require("fs");
const utils_1 = require("./utils");
const chalk_1 = require("chalk");
exports.blog = {
    test: { permalink: /^\/(blog|research|libraries|notes)/ },
    transform: (foil) => __awaiter(void 0, void 0, void 0, function* () {
        let mdFile = null;
        for (let file of foil.meta.files) {
            if (/\.md$/.exec(file.path)) {
                mdFile = file;
            }
        }
        if (!mdFile) {
            return foil;
        }
        let updated = (0, utils_1.checkUpdated)(mdFile);
        if (updated) {
            console.log('📝 Blog Transformer:');
            var config = {
                input: (0, fs_1.readFileSync)(mdFile.path).toString(),
                rerouteLinks: link => (0, path_1.join)(foil.rootPermalink, link)
            };
            let bibPath = (0, path_1.join)(foil.meta.rootPath, 'bib.json');
            if ((0, fs_1.existsSync)(bibPath)) {
                config['citations'] = require(bibPath);
            }
            var article = (0, markademic_1.default)(config);
            console.log('🏫 Built ' +
                (0, chalk_1.yellow)((0, path_1.basename)(mdFile.path)) +
                ' with Markademic.');
            var audioFile = null;
            for (let file of foil.meta.files) {
                if (/\.mp3$/.exec(file.path)) {
                    audioFile = file.path
                        .substr(foil.meta.rootPath.length)
                        .replace(/\\/g, '/');
                }
            }
            var captions = [];
            var captionsPath = (0, path_1.join)(foil.meta.rootPath, 'captions.json');
            if ((0, fs_1.existsSync)(captionsPath)) {
                captions = require(captionsPath).captions;
                if (Array.isArray(captions)) {
                    captions = [];
                }
            }
            var data = {
                article,
                audio: {
                    file: audioFile,
                    captions
                }
            };
            if (typeof foil['data'] === 'object') {
                data = Object.assign(Object.assign({}, foil.data), { article });
            }
            return Object.assign(Object.assign({}, foil), { data });
        }
        return foil;
    })
};
//# sourceMappingURL=blog.js.map