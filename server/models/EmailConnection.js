const mongoose = require("mongoose");

const emailConnectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    provider: {
      type: String,
      enum: ["gmail"],
      default: "gmail",
      required: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    accessToken: {
      type: String,
      default: "",
    },

    refreshToken: {
      type: String,
      default: "",
    },

    tokenExpiryDate: {
      type: Date,
      default: null,
    },

    scope: {
      type: String,
      default: "",
    },

    connected: {
      type: Boolean,
      default: true,
    },

    lastCheckedAt: {
      type: Date,
      default: null,
    },

    lastHistoryId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("EmailConnection", emailConnectionSchema);