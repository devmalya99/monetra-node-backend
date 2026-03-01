import { Router } from "express";
import { signup, signin, getMe, logout, requestPasswordReset, resetPassword, verifyResetPassword } from "../controllers/auth.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

// Auth Routes
router.post("/signup", signup);
router.post("/signin", signin);
router.get("/me", protect, getMe);
router.post("/logout", logout);
router.post("/request-password-reset", requestPasswordReset);

// Combined Password Reset Path
router.get("/reset-password/:id", verifyResetPassword); // Verification & Redirect (For Email Links)
router.post("/reset-password/:id", resetPassword);     // Actual Password Update (For Form Submission)

export default router;
