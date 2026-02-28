import { Router } from "express";
import { getPremiumMemberships, verifyPremiumOrder, getLeaderboard, verifyPayment, handleRazorpayWebhook } from "../controllers/premium.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/memberships", getPremiumMemberships);
router.get("/leaderboard", protect, getLeaderboard);
router.post("/verify-order", protect, verifyPremiumOrder);
router.post("/verify-payment", protect, verifyPayment);
router.post("/razorpay-webhook", handleRazorpayWebhook);

export default router;
