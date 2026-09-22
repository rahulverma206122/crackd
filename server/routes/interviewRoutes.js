const express = require("express");
const multer = require("multer");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createInterview,
  submitAnswer,
  createNextInterviewBatch,
  getInterviewHistory,
  getInterviewDetails,
  getInterviewAnalytics,
  transcribeInterviewAudio,
} = require("../controllers/interviewController");

// ============================================================
// AUDIO UPLOAD CONFIGURATION
// ============================================================

// Store audio in memory because we directly send it
// to the Python AI service for transcription.
const audioUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// ============================================================
// AUTHENTICATION
// ============================================================

router.use(authMiddleware);

// ============================================================
// START INTERVIEW
// POST /api/interviews
// ============================================================

router.post(
  "/",
  createInterview
);

// ============================================================
// SUBMIT ANSWER
// POST /api/interviews/answer
// ============================================================

router.post(
  "/answer",
  submitAnswer
);

// ============================================================
// START NEXT 10 QUESTIONS
// POST /api/interviews/next-batch
// ============================================================

router.post(
  "/next-batch",
  createNextInterviewBatch
);

// ============================================================
// TRANSCRIBE INTERVIEW AUDIO
// POST /api/interviews/transcribe
// ============================================================

router.post(
  "/transcribe",
  audioUpload.single("file"),
  transcribeInterviewAudio
);

// ============================================================
// INTERVIEW ANALYTICS
// GET /api/interviews/analytics
// ============================================================

router.get(
  "/analytics",
  getInterviewAnalytics
);

// ============================================================
// INTERVIEW HISTORY
// GET /api/interviews
// ============================================================

router.get(
  "/",
  getInterviewHistory
);

// ============================================================
// SINGLE INTERVIEW DETAILS
// GET /api/interviews/:interviewId
// ============================================================

router.get(
  "/:interviewId",
  getInterviewDetails
);

module.exports = router;