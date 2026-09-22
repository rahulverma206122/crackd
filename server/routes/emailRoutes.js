const express = require("express");

const {
  connectGmail,
  gmailCallback,
  getGmailStatus,
  disconnectGmail,
} = require("../controllers/emailController");

const {
  checkCompanyResponses,
  acknowledgeCompanyResponse,
} = require("../controllers/emailMonitorController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// GMAIL OAUTH
// ======================================================

// Start Gmail OAuth connection
router.get(
  "/connect",
  authMiddleware,
  connectGmail
);

// Google OAuth callback
// This route must NOT use authMiddleware because Google
// redirects the browser here directly.
router.get(
  "/callback",
  gmailCallback
);

// Get current Gmail connection status
router.get(
  "/status",
  authMiddleware,
  getGmailStatus
);

// Disconnect Gmail
router.delete(
  "/disconnect",
  authMiddleware,
  disconnectGmail
);

// ======================================================
// COMPANY RESPONSE MONITORING
// ======================================================

// Check Gmail for company responses
router.get(
  "/check-responses",
  authMiddleware,
  checkCompanyResponses
);

// Acknowledge a company response
router.patch(
  "/applications/:applicationId/acknowledge",
  authMiddleware,
  acknowledgeCompanyResponse
);

module.exports = router;