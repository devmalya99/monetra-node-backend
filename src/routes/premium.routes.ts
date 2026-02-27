import { Router } from "express";
import { getPremiumMemberships, verifyPremiumOrder } from "../controllers/premium.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.get("/memberships", getPremiumMemberships);
router.post("/verify-order", protect, verifyPremiumOrder);

export default router;
