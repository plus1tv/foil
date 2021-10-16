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
exports.book = void 0;
const markademic_1 = __importDefault(require("markademic"));
const path_1 = require("path");
const fs_1 = require("fs");
exports.book = {
    test: { permalink: /^\/books\/|docs/ },
    transform: (foil) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('📚 Book Transformer: \n');
        let navStructure = [];
        let chapters = [];
        let toc = null;
        for (let file of foil.meta.files) {
            if (/(summary)|(toc)|(table-of-contents)/i.exec(file.path) != null) {
                toc = file;
                break;
            }
        }
        if (!toc) {
            throw new Error('Foil book is missing a Table of Contents! Create a file called `toc.md` in the root directory of this entry.');
        }
        let tocString = (0, fs_1.readFileSync)(toc.path).toString();
        let tocUnorderedLists = /(\n\s*(\-|\+|\*)\s.*)+/g.exec(tocString);
        if (!tocUnorderedLists) {
            throw new Error('Table of contents is missing an unordered list of links. This is needed to build navigation data structures and traverse the book.');
        }
        tocString = tocString.substr(tocUnorderedLists.index, tocString.length);
        let prevParent = navStructure;
        let curParent = navStructure;
        let curTabCount = 0.0;
        let linkRegex = /\[([^\[]+)\]\(([^\)]+)\)/g;
        let match = linkRegex.exec(tocString);
        while (match != null) {
            let curNavStruct = {
                text: match[1],
                link: match[2],
                children: []
            };
            curParent.push(curNavStruct);
            match = linkRegex.exec(tocString);
        }
        for (let child of navStructure) {
            let isFile = /\.[^/.]+$/.exec(child.link);
            let isPath = /(\/|\\)$/.exec(child.link);
            let filePath = (0, path_1.join)(foil.meta.rootPath, child.link);
            if (isFile) {
                child.link = child.link.replace(/\.[^/.]+$/, '');
            }
            if (isPath) {
                child.link = child.link.substr(0, child.link.length - 1);
                filePath += 'index.md';
            }
            child.link = (0, path_1.join)('/', foil.rootPermalink, child.link).replace(/\\/gi, '/');
            console.log(child.link);
            console.log(filePath);
            if (!isFile && !isPath) {
                filePath += '.md';
            }
            let citations = null;
            let bibPath = (0, path_1.join)(foil.meta.rootPath, 'bib.json');
            let localBibPath = (0, path_1.join)(filePath, isFile ? '..' : '', 'bib.json');
            if ((0, fs_1.existsSync)(bibPath)) {
                citations = require(bibPath);
            }
            if ((0, fs_1.existsSync)(localBibPath)) {
                let curCitations = require(localBibPath);
                citations = citations ? Object.assign(Object.assign({}, citations), curCitations) : curCitations;
            }
            if ((0, fs_1.existsSync)(filePath)) {
                var config = {
                    input: (0, fs_1.readFileSync)(filePath).toString(),
                    rerouteLinks: (link) => (0, path_1.join)(foil.rootPermalink, link)
                };
                if (citations) {
                    config['citations'] = citations;
                }
                var contents = (0, markademic_1.default)(config);
                chapters.push(contents);
            }
        }
        return Object.assign(Object.assign({}, foil), { data: {
                toc: navStructure,
                chapters
            } });
    })
};
//# sourceMappingURL=book.js.map