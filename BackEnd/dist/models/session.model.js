"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthSessionModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const modelName_const_1 = require("../const/modelName.const");
const AuthSessionSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: modelName_const_1.DbModelName.USER,
        required: true,
        index: true,
    },
    tokenHash: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    userAgent: {
        type: String,
        trim: true,
    },
    ip: {
        type: String,
        trim: true,
    },
    lastUsedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },
    revokedAt: {
        type: Date,
        default: null,
    },
    replacedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: modelName_const_1.DbModelName.AUTH_SESSION,
        default: null,
    },
}, { timestamps: true });
AuthSessionSchema.index({ userId: 1, revokedAt: 1 });
AuthSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.AuthSessionModel = mongoose_1.default.model(modelName_const_1.DbModelName.AUTH_SESSION, AuthSessionSchema);
