const Resume = require("../models/Resume");
const JobDescription = require("../models/JobDescription");
const Analysis = require("../models/Analysis");
const ResumeOptimization = require("../models/ResumeOptimization");

const {
  analyzeResumeAgainstJD,
  optimizeResume,
} = require("../services/aiService");

// ======================================================
// CREATE AI ANALYSIS
// ======================================================

const createAnalysis = async (req, res) => {
  try {
    const { resumeId, jobDescriptionId } = req.body;

    if (!resumeId || !jobDescriptionId) {
      return res.status(400).json({
        success: false,
        message: "resumeId and jobDescriptionId are required",
      });
    }

    const resume = await Resume.findOne({
      _id: resumeId,
      user: req.user.userId,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    if (
      resume.extractionStatus !== "completed" ||
      !resume.extractedText?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Resume text is not available for analysis",
      });
    }

    const jobDescription = await JobDescription.findOne({
      _id: jobDescriptionId,
      user: req.user.userId,
    });

    if (!jobDescription) {
      return res.status(404).json({
        success: false,
        message: "Job description not found",
      });
    }

    if (!jobDescription.descriptionText?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job description text is empty",
      });
    }

    console.log("Starting AI analysis...");

    const aiResult = await analyzeResumeAgainstJD(
      resume.extractedText,
      jobDescription.descriptionText
    );

    const analysis = await Analysis.create({
      user: req.user.userId,
      resume: resume._id,
      jobDescription: jobDescription._id,

      atsScore: aiResult.ats_score,
      summary: aiResult.summary,

      matchedSkills: aiResult.matched_skills,
      missingSkills: aiResult.missing_skills,
      partialSkills: aiResult.partial_skills,

      keywordMatches: aiResult.keyword_matches,
      importantKeywordsMissing: aiResult.important_keywords_missing,

      skillAnalysis: aiResult.skill_analysis,

      resumeStrengths: aiResult.resume_strengths,
      resumeGaps: aiResult.resume_gaps,
      recommendations: aiResult.recommendations,
    });

    return res.status(201).json({
      success: true,
      message: "AI analysis completed",
      analysis,
    });
  } catch (error) {
    console.error("Create analysis error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "AI analysis failed",
    });
  }
};

// ======================================================
// GET ALL ANALYSES
// ======================================================

const getAnalyses = async (req, res) => {
  try {
    const analyses = await Analysis.find({
      user: req.user.userId,
    })
      .populate("resume", "originalName")
      .populate(
        "jobDescription",
        "title company role"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      analyses,
    });
  } catch (error) {
    console.error("Get analyses error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get analyses",
    });
  }
};

// ======================================================
// GET ANALYSIS BY ID
// ======================================================

const getAnalysisById = async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user: req.user.userId,
    })
      .populate("resume", "originalName")
      .populate(
        "jobDescription",
        "title company role"
      );

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found",
      });
    }

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Get analysis by ID error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get analysis",
    });
  }
};

// ======================================================
// CREATE AI RESUME OPTIMIZATION
// ======================================================

const createOptimization = async (req, res) => {
  try {
    const {
      resumeId,
      jobDescriptionId,
    } = req.body;

    if (!resumeId || !jobDescriptionId) {
      return res.status(400).json({
        success: false,
        message:
          "resumeId and jobDescriptionId are required",
      });
    }

    // Find user's resume
    const resume = await Resume.findOne({
      _id: resumeId,
      user: req.user.userId,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    // Check resume extraction
    if (
      resume.extractionStatus !== "completed" ||
      !resume.extractedText?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Resume text is not available for optimization",
      });
    }

    // Find user's job description
    const jobDescription =
      await JobDescription.findOne({
        _id: jobDescriptionId,
        user: req.user.userId,
      });

    if (!jobDescription) {
      return res.status(404).json({
        success: false,
        message:
          "Job description not found",
      });
    }

    // Check JD text
    if (
      !jobDescription.descriptionText?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Job description text is empty",
      });
    }

    console.log(
      "Starting AI resume optimization..."
    );

    // Call Python AI service
    const aiResult = await optimizeResume(
      resume.extractedText,
      jobDescription.descriptionText
    );

    // Save result
    const optimization =
      await ResumeOptimization.create({
        user: req.user.userId,

        resume: resume._id,

        jobDescription:
          jobDescription._id,

        suggestions:
          aiResult.suggestions,

        keywordsToAdd:
          aiResult.keywords_to_add,

        keywordsNotSupported:
          aiResult.keywords_not_supported,

        atsImprovements:
          aiResult.ats_improvements,
      });

    return res.status(201).json({
      success: true,

      message:
        "AI resume optimization completed",

      optimization,
    });

  } catch (error) {
    console.error(
      "Create optimization error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "AI resume optimization failed",
    });
  }
};

// ======================================================
// GET ALL OPTIMIZATIONS
// ======================================================

const getOptimizations = async (req, res) => {
  try {
    const optimizations = await ResumeOptimization.find({
      user: req.user.userId,
    })
      .populate("resume", "originalName")
      .populate(
        "jobDescription",
        "title company role"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      optimizations,
    });
  } catch (error) {
    console.error("Get optimizations error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to get optimizations",
    });
  }
};

// ======================================================
// GET OPTIMIZATION BY ID
// ======================================================

const getOptimizationById = async (req, res) => {
  try {
    const optimization = await ResumeOptimization.findOne({
      _id: req.params.id,
      user: req.user.userId,
    })
      .populate("resume", "originalName")
      .populate(
        "jobDescription",
        "title company role"
      );

    if (!optimization) {
      return res.status(404).json({
        success: false,
        message: "Optimization not found",
      });
    }

    return res.status(200).json({
      success: true,
      optimization,
    });
  } catch (error) {
    console.error(
      "Get optimization by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to get optimization",
    });
  }
};

// ======================================================
// EXPORT CONTROLLERS
// ======================================================

module.exports = {
  createAnalysis,
  getAnalyses,
  getAnalysisById,

  createOptimization,
  getOptimizations,
  getOptimizationById,
};