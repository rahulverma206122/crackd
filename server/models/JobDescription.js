const mongoose = require("mongoose");

const jobDescriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: String,
      trim: true,
      default: "",
    },

    role: {
      type: String,
      trim: true,
      default: "",
    },

    sourceType: {
      type: String,
      enum: ["text", "file"],
      required: true,
    },

    originalName: {
      type: String,
      default: "",
    },

    fileName: {
      type: String,
      default: "",
    },

    filePath: {
      type: String,
      default: "",
    },

    fileType: {
      type: String,
      enum: ["pdf", "docx", null],
      default: null,
    },

    fileSize: {
      type: Number,
      default: 0,
    },

    descriptionText: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("JobDescription", jobDescriptionSchema);