import { Router } from "express";
import { addExpense, getExpenses, deleteExpense, updateBalance, getMonthlyBalance, getTopCategories, searchExpenses } from "../controllers/expense.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/add-expense", protect, addExpense);
router.get("/my-expenses", protect, getExpenses);
router.delete("/delete-expense/:id", protect, deleteExpense);
router.post("/update-balance", protect, updateBalance);
router.get("/monthly-balance", protect, getMonthlyBalance);
router.get("/top-categories", protect, getTopCategories);
router.get("/search-expenses", protect, searchExpenses);

export default router;
