const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createAnalysis,
  getAnalyses,
  getAnalysisById,
  createOptimization,
  getOptimizations,
  getOptimizationById,
} = require("../controllers/analysisController");


router.use(authMiddleware);


// ================================
// AI Resume Analysis
// ================================

router.post("/", createAnalysis);

router.get("/", getAnalyses);


// ================================
// AI Resume Optimization
// ================================

router.post("/optimize", createOptimization);

router.get("/optimizations", getOptimizations);

router.get(
  "/optimizations/:id",
  getOptimizationById
);


// Keep dynamic route LAST
router.get("/:id", getAnalysisById);


module.exports = router;