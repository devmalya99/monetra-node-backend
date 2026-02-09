import { Router } from "express";
import authRoutes from "./auth.routes";
import testRoutes from "./test.routes";

const router = Router();

router.use("/user", authRoutes);
router.use("/test", testRoutes);

router.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Welcome to Monetra Node Backend 🚀. Please visit /api-docs for documentation.",
    });
});

export default router;
