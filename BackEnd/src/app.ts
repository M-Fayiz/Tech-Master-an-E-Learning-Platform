import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { dbConnect } from "./config/db.config";
import { env } from "./config/env.config";
import { errorHandler } from "./middlewares/error-handling.middleware";
import { corsSetUp } from "./config/cors.config";
import authRouter from "./routers/auth.router";
import cookieParser from "cookie-parser";
import passport from "passport";
import userRouter from "./routers/user.router";
import adminRouter from "./routers/admin.router";
import categoryRouter from "./routers/category.router";
import courseRouter from "./routers/courses.router";
import sharedRouter from "./routers/shared.router";
import enrolledRouter from "./routers/enrolled.router";
import reviewRouter from "./routers/review.router";
import http from "http";
import { intitializeSocket } from "./socket.io";
import notifyRouter from "./routers/notification.router";
import chatRouter from "./routers/chat.router";
import slotRouter from "./routers/slots.router";
import bookingROuter from "./routers/slotbooking.router";
import orderRouter from "./routers/order.router";
import webhookRouter from "./routers/webhook.router";
import videoSessionRouter from "./routers/videoSession.router";
import certificateRouter from "./routers/certificate.router";
import chatBotRouter from "./routers/chatbot.router";
import { HttpStatusCode } from "axios";
import { HttpResponse } from "./const/error-message.const";

dotenv.config();

const app = express();

app.use(cookieParser());
app.use(morgan("dev"));

app.use(
  "/api/v1/webhook",
  express.raw({ type: "application/json" }),
  webhookRouter,
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
intitializeSocket(server);

app.use(passport.initialize());
app.use(cors(corsSetUp));

app.all("/api/v1/health", (req, res) => {
  
  res.status(HttpStatusCode.Ok).json({
    status: HttpResponse.OK,
    timestamp: Date.now(),
  });
});



app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/shared", sharedRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/enrollements", enrolledRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/notifications", notifyRouter);
app.use("/api/v1/chats", chatRouter);
app.use("/api/v1/slots", slotRouter);
app.use("/api/v1/slot-booking", bookingROuter);
app.use("/api/v1/video", videoSessionRouter);
app.use("/api/v1/certificate", certificateRouter);
app.use("/api/v1/chat-bot", chatBotRouter);

const port = env.port;

app.use(errorHandler);

async function bootstrap() {
  try {
    await dbConnect();
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

void bootstrap();
