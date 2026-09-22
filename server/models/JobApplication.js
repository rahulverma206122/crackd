const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    jobRole: {
      type: String,
      required: true,
      trim: true,
    },

    applicationDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    jobDescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobDescription",
      default: null,
    },

    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Applied",
        "Assessment",
        "Recruiter Contacted",
        "Interview",
        "Offer",
        "Rejected",
        "Withdrawn",
        "No Response",
      ],
      default: "Applied",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    // ==================================================
    // COMPANY RESPONSE TRACKING
    // ==================================================

    responseReceived: {
      type: Boolean,
      default: false,
    },

    // Date of the latest company response
    responseDate: {
      type: Date,
      default: null,
    },

    // Kept for compatibility with existing frontend/controller
    lastResponseDate: {
      type: Date,
      default: null,
    },

    responseSender: {
      type: String,
      trim: true,
      default: "",
    },

    responseSubject: {
      type: String,
      trim: true,
      default: "",
    },

    responseSnippet: {
      type: String,
      trim: true,
      default: "",
    },

    responseMessageId: {
      type: String,
      trim: true,
      default: "",
    },

    responseThreadId: {
      type: String,
      trim: true,
      default: "",
    },

    // false = NEW RESPONSE notification should be shown
    // true = user has already opened/acknowledged the response
    responseAcknowledged: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "JobApplication",
  jobApplicationSchema
);