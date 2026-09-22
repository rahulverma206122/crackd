const express = require("express");

const {
  createJobApplication,
  getJobApplications,
  getJobApplicationById,
  updateJobApplication,
  deleteJobApplication,
} = require("../controllers/jobApplicationController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create a new job application
router.post("/", authMiddleware, createJobApplication);

// Get all applications of logged-in user
router.get("/", authMiddleware, getJobApplications);

// Get a single application
router.get("/:applicationId", authMiddleware, getJobApplicationById);

// Update an application
router.put("/:applicationId", authMiddleware, updateJobApplication);

// Delete an application
router.delete("/:applicationId", authMiddleware, deleteJobApplication);

module.exports = router;