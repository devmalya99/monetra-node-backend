import { Router } from "express";
import { addExpense, getExpenses, deleteExpense } from "../controllers/expense.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/add-expense", protect, addExpense);
router.get("/my-expenses", protect, getExpenses);
router.delete("/delete-expense/:id", protect, deleteExpense);

export default router;
