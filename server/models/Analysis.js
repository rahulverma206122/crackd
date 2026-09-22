const mongoose = require("mongoose");

const skillAnalysisSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["matched", "missing", "partial"],
      required: true,
    },

    evidence: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },

    jobDescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobDescription",
      required: true,
    },

    atsScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    summary: {
      type: String,
      default: "",
    },

    matchedSkills: {
      type: [String],
      default: [],
    },

    missingSkills: {
      type: [String],
      default: [],
    },

    partialSkills: {
      type: [String],
      default: [],
    },

    keywordMatches: {
      type: [String],
      default: [],
    },

    importantKeywordsMissing: {
      type: [String],
      default: [],
    },

    skillAnalysis: {
      type: [skillAnalysisSchema],
      default: [],
    },

    resumeStrengths: {
      type: [String],
      default: [],
    },

    resumeGaps: {
      type: [String],
      default: [],
    },

    recommendations: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Analysis",
  analysisSchema
);