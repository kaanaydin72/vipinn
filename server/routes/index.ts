import { Router } from "express";
import authRoutes from "../services/auth";
import priceRulesRoutes from "./price-rules";

const router = Router();

router.use("/auth", authRoutes);
router.use("/price-rules", priceRulesRoutes);

export { router as registerRoutes };
