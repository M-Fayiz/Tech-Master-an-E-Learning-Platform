"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.verifyAccesToken = verifyAccesToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = require("../config/env.config");
const ACCESS_TOKEN = env_config_1.env.ACCESS_TOKEN;
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, ACCESS_TOKEN, { expiresIn: "15m" });
}
function verifyAccesToken(token) {
    return jsonwebtoken_1.default.verify(token, ACCESS_TOKEN);
}
