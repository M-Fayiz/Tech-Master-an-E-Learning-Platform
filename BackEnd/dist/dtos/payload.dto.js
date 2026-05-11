"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payloadDTO = void 0;
const payloadDTO = (user, sessionId) => {
    return {
        _id: user._id,
        email: user.email,
        role: user.role,
        sessionId,
    };
};
exports.payloadDTO = payloadDTO;
