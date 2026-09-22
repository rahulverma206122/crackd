const mongoose = require("mongoose");

const ResumeSuggestionSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      required: true,
    },

    original: {
      type: String,
      required: true,
    },

    replacement: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  }
);


const ResumeOptimizationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

    suggestions: {
      type: [ResumeSuggestionSchema],
      default: [],
    },

    keywordsToAdd: {
      type: [String],
      default: [],
    },

    keywordsNotSupported: {
      type: [String],
      default: [],
    },

    atsImprovements: {
      type: [String],
      default: [],
    },
  },

  {
    timestamps: true,
  }
);


module.exports =
  mongoose.model(
    "ResumeOptimization",
    ResumeOptimizationSchema
  );