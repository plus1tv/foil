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
exports.database = void 0;
const mongodb_1 = require("mongodb");
const url = 'mongodb://localhost:27017';
console.log('🍃 Opening MongoDB Connection.');
const database = mongodb_1.MongoClient.connect(url).catch((reason) => console.error(reason));
exports.database = database;
function closeConnection() {
    database.then((client) => __awaiter(this, void 0, void 0, function* () {
        console.log('🍃 Closing MongoDB Connection.');
        client.close();
        process.exit();
    }));
}
process.on('SIGTERM', closeConnection).on('SIGINT', closeConnection);
//# sourceMappingURL=db.js.map