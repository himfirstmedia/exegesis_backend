import express from "express";
import * as authController from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authLimiter, registerLimiter } from "../../middlewares/rateLimiter.middleware.js";

const router = express.Router();

router.post("/register", registerLimiter, authController.register);
router.post("/verify-account", authLimiter, authController.verifyAccount);
router.post("/verify-code", authLimiter, authController.verifyCode);
router.post("/login", authLimiter, authController.login);
router.post("/google-login", authLimiter, authController.googleLogin);
router.post("/complete-google-registration", registerLimiter, authController.completeGoogleRegistration);
router.post("/login-failed", authController.loginFailed);
router.post("/refresh", authenticate, authController.refresh);
router.post("/logout", authenticate, authController.logout);
router.post("/get-current-user", authenticate, authController.getCurrentUser);
router.post("/update-current-user", authenticate, authController.updateCurrentUser);
router.post("/upload-cover", authenticate, authController.uploadCover);
router.post("/upload-profile-photo", authenticate, authController.uploadProfilePhoto);
router.post("/update-password", authenticate, authController.updatePassword);
router.post("/force-change-password", authenticate, authController.forceChangePassword);
router.post("/resend-verification", authLimiter, authController.resendVerification);
router.post("/set-password", authLimiter, authController.setPassword);
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/reset-password", authLimiter, authController.resetPassword);
router.get("/test", authController.test);

export default router;
