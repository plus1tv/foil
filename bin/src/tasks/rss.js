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
exports.rssFeed = void 0;
const rss_1 = __importDefault(require("rss"));
const db_1 = require("../db");
const fs_1 = require("fs");
const path_1 = require("path");
const config_1 = require("../config");
function rssFeed(_foils) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('📻 Foil RSS Feeds \n');
        let config = {
            title: 'Alain.xyz',
            description: config_1.config.description,
            feed_url: config_1.config.author.url + '/rss',
            site_url: config_1.config.author.url,
            image_url: config_1.config.cover,
            managingEditor: config_1.config.author.name,
            webMaster: config_1.config.author.name,
            copyright: 'Copyright ' + config_1.config.author.name + ' All Rights Reserved.',
            language: 'English',
            categories: config_1.config.tags,
            pubDate: new Date(),
            ttl: 1200
        };
        let rss = new rss_1.default(config);
        let foilfolioData = yield new Promise((res, _) => db_1.database.then(client => {
            let db = client.db('db');
            var col = db.collection('portfolio');
            col.find({
                datePublished: { $lte: new Date() },
                permalink: new RegExp('/blog/w*')
            })
                .limit(30)
                .sort({
                datePublished: -1
            })
                .toArray((err, data) => {
                if (err || data.length === 0)
                    return res([]);
                res(data);
            });
        }));
        for (var item of foilfolioData) {
            let fileData = yield new Promise((res, _) => db_1.database.then(client => {
                let db = client.db('db');
                var col = db.collection('redirect');
                col.find({
                    from: item.cover
                })
                    .limit(1)
                    .toArray((err, data) => {
                    if (err || data.length === 0)
                        return res(null);
                    res(data);
                });
            }));
            var filesize = 0;
            if (fileData) {
                filesize = (0, fs_1.statSync)(fileData[0].to).size;
            }
            rss.item({
                title: item.title,
                description: item.description,
                url: config_1.config.author.url + item.permalink,
                date: item.datePublished,
                enclosure: {
                    url: config_1.config.author.url + item.cover,
                    size: filesize
                }
            });
        }
        let xml = rss.xml();
        let p = (0, path_1.join)(config_1.config.currentDir, 'rss.xml');
        try {
            (0, fs_1.writeFileSync)(p, xml);
            console.log('RSS feed successfully generated. \n Written to ' + p + '\n');
        }
        catch (e) {
            console.error('Could not generate RSS Feeds! \n');
        }
    });
}
exports.rssFeed = rssFeed;
//# sourceMappingURL=rss.js.map