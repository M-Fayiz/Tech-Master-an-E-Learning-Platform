import express from "express";
import { Validate } from "../middlewares/validate";

const authRouter = express.Router();
import { UserRepository } from "../repository/implementation/UserRepository";
import { AuthService } from "../services/implementation/AuthService";
import { AuthController } from "../controllers/implementation/AuthController";
import { registerSchema } from "../utils/zod";
import passport from "../utils/passport.util";
import { env } from "../config/env.config";
import { SessionRepository } from "../repository/implementation/SessionRepository";

const userRepository = new UserRepository();
const sessionRepository = new SessionRepository();
const authService = new AuthService(userRepository, sessionRepository);
const authController = new AuthController(authService);

authRouter.post(
  "/signup",
  Validate(registerSchema),
  authController.signUp.bind(authController),
);
authRouter.post(
  "/verify-email",
  authController.verifyEmail.bind(authController),
);
authRouter.post("/me", authController.authMe.bind(authController));
authRouter.get(
  "/refresh-token",
  authController.refreshToken.bind(authController),
);
authRouter.post("/login", authController.login.bind(authController));
authRouter.post("/logout", authController.logout.bind(authController));
authRouter.post(
  "/forgot-password",
  authController.forgotPassword.bind(authController),
);
authRouter.patch(
  "/reset-password",
  authController.resetPassword.bind(authController),
);

// Google Auth
authRouter.get("/google", (req, res, next) => {
  const { role } = req.query;

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: JSON.stringify({ role }),
    prompt: "select_account",
  })(req, res, next);
});

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${env.CLIENT_ORGIN}/auth/login`,
  }),
  authController.googleAuthRedirection.bind(authController),
);

export default authRouter;
