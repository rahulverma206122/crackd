const express = require("express");

const {
  uploadResume,
  getResumes,
  getResumeById,
  setDefaultResume,
  deleteResume,
} = require("../controllers/resumeController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(protect);

// Upload resume
router.post(
  "/upload",
  upload.single("resume"),
  uploadResume
);

// Get all resumes
router.get("/", getResumes);

// Get single resume
router.get("/:id", getResumeById);

// Set resume as default
router.patch("/:id/default", setDefaultResume);

// Delete resume
router.delete("/:id", deleteResume);

module.exports = router;