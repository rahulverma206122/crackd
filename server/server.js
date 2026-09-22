const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const jobDescriptionRoutes = require("./routes/jobDescriptionRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const jobApplicationRoutes = require("./routes/jobApplicationRoutes");
const emailRoutes = require("./routes/emailRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// Connect MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/job-descriptions", jobDescriptionRoutes);
app.use("/api/analyses", analysisRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/applications", jobApplicationRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/notifications", notificationRoutes);

// Test root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Crackd.ai server is running 🚀",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});