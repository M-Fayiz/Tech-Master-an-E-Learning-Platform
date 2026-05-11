"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const db_config_1 = require("./config/db.config");
const env_config_1 = require("./config/env.config");
const error_handling_middleware_1 = require("./middlewares/error-handling.middleware");
const cors_config_1 = require("./config/cors.config");
const auth_router_1 = __importDefault(require("./routers/auth.router"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const passport_1 = __importDefault(require("passport"));
const user_router_1 = __importDefault(require("./routers/user.router"));
const admin_router_1 = __importDefault(require("./routers/admin.router"));
const category_router_1 = __importDefault(require("./routers/category.router"));
const courses_router_1 = __importDefault(require("./routers/courses.router"));
const shared_router_1 = __importDefault(require("./routers/shared.router"));
const enrolled_router_1 = __importDefault(require("./routers/enrolled.router"));
const review_router_1 = __importDefault(require("./routers/review.router"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("./socket.io");
const notification_router_1 = __importDefault(require("./routers/notification.router"));
const chat_router_1 = __importDefault(require("./routers/chat.router"));
const slots_router_1 = __importDefault(require("./routers/slots.router"));
const slotbooking_router_1 = __importDefault(require("./routers/slotbooking.router"));
const order_router_1 = __importDefault(require("./routers/order.router"));
const webhook_router_1 = __importDefault(require("./routers/webhook.router"));
const videoSession_router_1 = __importDefault(require("./routers/videoSession.router"));
const certificate_router_1 = __importDefault(require("./routers/certificate.router"));
const chatbot_router_1 = __importDefault(require("./routers/chatbot.router"));
const axios_1 = require("axios");
const error_message_const_1 = require("./const/error-message.const");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use("/api/v1/webhook", express_1.default.raw({ type: "application/json" }), webhook_router_1.default);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const server = http_1.default.createServer(app);
(0, socket_io_1.intitializeSocket)(server);
app.use(passport_1.default.initialize());
app.use((0, cors_1.default)(cors_config_1.corsSetUp));
app.all("/api/v1/health", (req, res) => {
    res.status(axios_1.HttpStatusCode.Ok).json({
        status: error_message_const_1.HttpResponse.OK,
        timestamp: Date.now(),
    });
});
app.use("/api/v1/auth", auth_router_1.default);
app.use("/api/v1/users", user_router_1.default);
app.use("/api/v1/admin", admin_router_1.default);
app.use("/api/v1/categories", category_router_1.default);
app.use("/api/v1/courses", courses_router_1.default);
app.use("/api/v1/shared", shared_router_1.default);
app.use("/api/v1/orders", order_router_1.default);
app.use("/api/v1/enrollements", enrolled_router_1.default);
app.use("/api/v1/reviews", review_router_1.default);
app.use("/api/v1/notifications", notification_router_1.default);
app.use("/api/v1/chats", chat_router_1.default);
app.use("/api/v1/slots", slots_router_1.default);
app.use("/api/v1/slot-booking", slotbooking_router_1.default);
app.use("/api/v1/video", videoSession_router_1.default);
app.use("/api/v1/certificate", certificate_router_1.default);
app.use("/api/v1/chat-bot", chatbot_router_1.default);
const port = env_config_1.env.port;
app.use(error_handling_middleware_1.errorHandler);
async function bootstrap() {
    try {
        await (0, db_config_1.dbConnect)();
        server.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    }
    catch (error) {
        console.error("Failed to start server", error);
        process.exit(1);
    }
}
void bootstrap();
