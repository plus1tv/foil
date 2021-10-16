"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clean_1 = require("./clean");
const builder_1 = require("./builder");
const rss_1 = require("./rss");
const redirects_1 = require("./redirects");
exports.default = [
    clean_1.clean,
    builder_1.build,
    rss_1.rssFeed,
    redirects_1.redirects
];
//# sourceMappingURL=index.js.map