"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsSetUp = void 0;
const env_config_1 = require("./env.config");
const allowedOrigins = [env_config_1.env.CLIENT_URL_2, env_config_1.env.CLIENT_ORGIN];
console.log("alowsed origin :", allowedOrigins);
exports.corsSetUp = {
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
};
