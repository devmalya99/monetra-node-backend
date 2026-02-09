import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /test:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns a success message and timestamp
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Test endpoint working
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Test endpoint working",
        timestamp: new Date().toISOString(),
    });
});

export default router;
