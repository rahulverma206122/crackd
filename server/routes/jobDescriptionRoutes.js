const express = require("express");

const {
  createJobDescription,
  uploadJobDescription,
  getJobDescriptions,
  getJobDescriptionById,
  deleteJobDescription,
} = require("../controllers/jobDescriptionController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/jdUploadMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createJobDescription);

router.post(
  "/upload",
  upload.single("jobDescription"),
  uploadJobDescription
);

router.get("/", getJobDescriptions);

router.get("/:id", getJobDescriptionById);

router.delete("/:id", deleteJobDescription);

module.exports = router;