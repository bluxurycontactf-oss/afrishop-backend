"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = require("firebase-functions");
const main_1 = require("./main");
let initialized = false;
const server = functions
    .runWith({
    timeoutSeconds: 60,
    memory: '512MB',
})
    .https.onRequest(async (req, res) => {
    if (!initialized) {
        await (0, main_1.createNestApp)();
        initialized = true;
    }
    (0, main_1.expressApp)(req, res);
});
exports.api = server;
//# sourceMappingURL=firebase.js.map