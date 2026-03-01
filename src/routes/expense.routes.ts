import { Router } from "express";
import { addExpense, getExpenses, deleteExpense, updateExpense, updateBalance, getMonthlyBalance, getTopCategories, searchExpenses, suggestCategory } from "../controllers/expense.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.post("/add-expense", protect, addExpense);
router.get("/my-expenses", protect, getExpenses);
router.delete("/delete-expense/:id", protect, deleteExpense);
router.patch("/update-expense/:id", protect, updateExpense);
router.post("/update-balance", protect, updateBalance);
router.get("/monthly-balance", protect, getMonthlyBalance);
router.get("/top-categories", protect, getTopCategories);
router.get("/search-expenses", protect, searchExpenses);
router.post("/suggest-category", protect, suggestCategory);

export default router;
