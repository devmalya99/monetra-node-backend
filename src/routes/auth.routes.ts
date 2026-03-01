import { Router } from "express";
import { signup, signin, getMe, logout, requestPasswordReset } from "../controllers/auth.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

// Auth Routes
router.post("/signup", signup);
router.post("/signin", signin);
router.get("/me", protect, getMe);
router.post("/logout", logout);
router.post("/request-password-reset", requestPasswordReset);

export default router;
