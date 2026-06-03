"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validate_1 = require("../middlewares/validate");
const authRouter = express_1.default.Router();
const UserRepository_1 = require("../repository/implementation/UserRepository");
const AuthService_1 = require("../services/implementation/AuthService");
const AuthController_1 = require("../controllers/implementation/AuthController");
const zod_1 = require("../utils/zod");
const passport_util_1 = __importDefault(require("../utils/passport.util"));
const env_config_1 = require("../config/env.config");
const SessionRepository_1 = require("../repository/implementation/SessionRepository");
const userRepository = new UserRepository_1.UserRepository();
const sessionRepository = new SessionRepository_1.SessionRepository();
const authService = new AuthService_1.AuthService(userRepository, sessionRepository);
const authController = new AuthController_1.AuthController(authService);
authRouter.post("/signup", (0, validate_1.Validate)(zod_1.registerSchema), authController.signUp.bind(authController));
authRouter.post("/verify-email", authController.verifyEmail.bind(authController));
authRouter.post("/me", authController.authMe.bind(authController));
authRouter.get("/refresh-token", authController.refreshToken.bind(authController));
authRouter.post("/login", authController.login.bind(authController));
authRouter.post("/logout", authController.logout.bind(authController));
authRouter.post("/forgot-password", authController.forgotPassword.bind(authController));
authRouter.patch("/reset-password", authController.resetPassword.bind(authController));
// Google Auth
authRouter.get("/google", (req, res, next) => {
    const { role } = req.query;
    passport_util_1.default.authenticate("google", {
        scope: ["profile", "email"],
        state: JSON.stringify({ role }),
        prompt: "select_account",
    })(req, res, next);
});
authRouter.get("/google/callback", passport_util_1.default.authenticate("google", {
    session: false,
    failureRedirect: `${env_config_1.env.CLIENT_ORGIN}/auth/login`,
}), authController.googleAuthRedirection.bind(authController));
exports.default = authRouter;
