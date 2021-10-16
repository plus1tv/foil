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
Object.defineProperty(exports, "__esModule", { value: true });
exports.redirects = void 0;
const db_1 = require("../db");
const config_1 = require("../config");
function redirects(_foils) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🏹 Foil Database Redirects\n');
        yield db_1.database.then((client) => __awaiter(this, void 0, void 0, function* () {
            let db = client.db('db');
            var redirectCollection = db.collection('redirect');
            var redirects = config_1.config.redirects;
            for (var rd of redirects) {
                if (rd.to && rd.from) {
                    let query = {
                        from: rd.from
                    };
                    let options = {
                        upsert: true
                    };
                    yield redirectCollection
                        .updateOne(query, { $set: { to: rd.to, from: rd.from } }, options)
                        .then(r => console.log(`Redirecting ${rd.from} to ${rd.to}.`))
                        .catch(e => console.log(e));
                }
            }
            console.log('✨ Cleaned portfolio collection.');
        }));
    });
}
exports.redirects = redirects;
//# sourceMappingURL=redirects.js.map