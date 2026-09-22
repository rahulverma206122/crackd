const JobApplication = require("../models/JobApplication");
const Notification = require("../models/Notification");

const {
  getEmailsSince,
  updateLastCheckedAt,
} = require("../services/gmailService");

// ======================================================
// Helper: Normalize Text
// ======================================================

const normalizeText = (value = "") => {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// ======================================================
// Helper: Get Meaningful Company Words
// ======================================================

const getCompanyKeywords = (companyName = "") => {
  const ignoredWords = new Set([
    "inc",
    "incorporated",
    "llc",
    "ltd",
    "limited",
    "corp",
    "corporation",
    "company",
    "co",
    "pvt",
    "private",
    "plc",
    "technologies",
    "technology",
    "solutions",
    "services",
    "group",
    "india",
  ]);

  return normalizeText(companyName)
    .split(" ")
    .filter(
      (word) =>
        word.length >= 3 &&
        !ignoredWords.has(word)
    );
};

// ======================================================
// Helper: Check Whether Email Matches Company
// ======================================================

const emailMatchesCompany = (email, companyName) => {
  if (!email || !companyName) {
    return false;
  }

  const companyKeywords = getCompanyKeywords(companyName);

  if (companyKeywords.length === 0) {
    return false;
  }

  const emailText = normalizeText(
    [
      email.from,
      email.subject,
      email.snippet,
    ].join(" ")
  );

  const senderText = normalizeText(email.from);

  // Strong match:
  // Company name appears in sender information.
  const senderMatches = companyKeywords.some((keyword) =>
    senderText.includes(keyword)
  );

  if (senderMatches) {
    return true;
  }

  // General match:
  // Company keyword appears in subject/snippet.
  const contentMatches = companyKeywords.some((keyword) =>
    emailText.includes(keyword)
  );

  return contentMatches;
};

// ======================================================
// Helper: Make Sure Email Is Actually After Application
// ======================================================

const isEmailAfterApplication = (email, application) => {
  if (!email?.internalDate) {
    return false;
  }

  if (!application?.applicationDate) {
    return true;
  }

  const emailDate = new Date(email.internalDate);
  const applicationDate = new Date(application.applicationDate);

  if (
    Number.isNaN(emailDate.getTime()) ||
    Number.isNaN(applicationDate.getTime())
  ) {
    return true;
  }

  return emailDate >= applicationDate;
};

// ======================================================
// Helper: Check If This Exact Email Was Already Saved
// ======================================================

const isAlreadySavedResponse = (application, email) => {
  if (!application || !email) {
    return false;
  }

  if (
    application.responseMessageId &&
    email.id &&
    application.responseMessageId === email.id
  ) {
    return true;
  }

  return false;
};

// ======================================================
// Helper: Create In-App Notification
// ======================================================

const createCompanyResponseNotification = async (
  userId,
  application,
  email
) => {
  try {
    // Extra protection against duplicate notifications.
    if (email?.id) {
      const existingNotification = await Notification.findOne({
        user: userId,
        type: "company_response",
        relatedId: application._id,
        "metadata.messageId": email.id,
      });

      if (existingNotification) {
        return existingNotification;
      }
    }

    const companyName =
      application.companyName || "Company";

    const jobRole =
      application.jobRole || "your job application";

    const subject =
      email.subject?.trim() ||
      "New company response";

    const message =
      email.snippet?.trim() ||
      `You received a new response from ${companyName} regarding your ${jobRole} application.`;

    const notification = await Notification.create({
      user: userId,

      type: "company_response",

      title: `New response from ${companyName}`,

      message,

      isRead: false,

      relatedId: application._id,

      relatedType: "JobApplication",

      metadata: {
        companyName,
        jobRole,
        subject,
        sender: email.from || "",
        messageId: email.id || "",
        threadId: email.threadId || "",
        responseDate:
          email.internalDate || new Date(),
      },
    });

    return notification;
  } catch (error) {
    // Notification failure should not break Gmail response detection.
    console.error(
      "Company response notification error:",
      error
    );

    return null;
  }
};

// ======================================================
// Check Gmail For Company Responses
// ======================================================

const checkCompanyResponses = async (req, res) => {
  try {
    const userId = req.user.userId;

    // --------------------------------------------------
    // Get user's job applications
    // --------------------------------------------------

    const applications = await JobApplication.find({
      user: userId,
    }).sort({
      applicationDate: -1,
    });

    if (applications.length === 0) {
      await updateLastCheckedAt(userId);

      return res.status(200).json({
        success: true,
        message: "No job applications found.",
        detectedResponses: [],
        checkedEmails: 0,
        checkedApplications: 0,
        checkedAt: new Date(),
      });
    }

    // --------------------------------------------------
    // Find earliest application date
    // --------------------------------------------------

    const applicationDates = applications
      .map((application) =>
        application.applicationDate
          ? new Date(application.applicationDate)
          : null
      )
      .filter(
        (date) =>
          date &&
          !Number.isNaN(date.getTime())
      );

    let startDate = new Date();

    if (applicationDates.length > 0) {
      startDate = new Date(
        Math.min(
          ...applicationDates.map((date) =>
            date.getTime()
          )
        )
      );
    }

    // --------------------------------------------------
    // Fetch incoming Gmail messages
    // --------------------------------------------------

    const emails = await getEmailsSince(
      userId,
      startDate
    );

    const detectedResponses = [];

    // --------------------------------------------------
    // Compare emails with applications
    // --------------------------------------------------

    for (const application of applications) {
      // ------------------------------------------------
      // If an application already has an unacknowledged
      // response, don't overwrite it.
      // ------------------------------------------------

      if (
        application.responseReceived &&
        !application.responseAcknowledged
      ) {
        continue;
      }

      for (const email of emails) {
        // ----------------------------------------------
        // Ignore emails before application date
        // ----------------------------------------------

        if (
          !isEmailAfterApplication(
            email,
            application
          )
        ) {
          continue;
        }

        // ----------------------------------------------
        // Ignore the exact same Gmail message
        // ----------------------------------------------

        if (
          isAlreadySavedResponse(
            application,
            email
          )
        ) {
          continue;
        }

        // ----------------------------------------------
        // Check company match
        // ----------------------------------------------

        const matchesCompany =
          emailMatchesCompany(
            email,
            application.companyName
          );

        if (!matchesCompany) {
          continue;
        }

        // ----------------------------------------------
        // Response detected
        // ----------------------------------------------

        const responseDate =
          email.internalDate ||
          new Date();

        const responseData = {
          responseReceived: true,

          responseDate,

          // Keep a dedicated last-response field
          // for the application.
          lastResponseDate: responseDate,

          responseSender:
            email.from || "",

          responseSubject:
            email.subject || "",

          responseSnippet:
            email.snippet || "",

          responseMessageId:
            email.id || "",

          responseThreadId:
            email.threadId || "",

          responseAcknowledged: false,
        };

        const updatedApplication =
          await JobApplication.findOneAndUpdate(
            {
              _id: application._id,
              user: userId,
            },
            {
              $set: responseData,
            },
            {
              new: true,
            }
          );

        // ----------------------------------------------
        // Create in-app notification
        // ----------------------------------------------

        await createCompanyResponseNotification(
          userId,
          updatedApplication || application,
          email
        );

        // ----------------------------------------------
        // Add response to API result
        // ----------------------------------------------

        detectedResponses.push({
          applicationId:
            application._id,

          companyName:
            application.companyName,

          jobRole:
            application.jobRole,

          responseDate:
            responseData.responseDate,

          lastResponseDate:
            responseData.lastResponseDate,

          responseSender:
            responseData.responseSender,

          responseSubject:
            responseData.responseSubject,

          responseSnippet:
            responseData.responseSnippet,

          responseMessageId:
            responseData.responseMessageId,

          responseThreadId:
            responseData.responseThreadId,
        });

        // Only associate one email with an
        // application during this check.
        break;
      }
    }

    // --------------------------------------------------
    // Update last checked time
    // --------------------------------------------------

    await updateLastCheckedAt(userId);

    // --------------------------------------------------
    // Return result
    // --------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        detectedResponses.length > 0
          ? "New company responses detected."
          : "No new company responses detected.",

      detectedResponses,

      checkedEmails:
        emails.length,

      checkedApplications:
        applications.length,

      checkedAt: new Date(),
    });
  } catch (error) {
    console.error(
      "Company response monitoring error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to check company responses.",
    });
  }
};

// ======================================================
// Acknowledge Response
// ======================================================

const acknowledgeCompanyResponse = async (
  req,
  res
) => {
  try {
    const userId = req.user.userId;

    const { applicationId } =
      req.params;

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message:
          "Application ID is required.",
      });
    }

    const application =
      await JobApplication.findOneAndUpdate(
        {
          _id: applicationId,
          user: userId,
        },
        {
          $set: {
            responseAcknowledged: true,
          },
        },
        {
          new: true,
        }
      );

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Job application not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Company response acknowledged.",
    });
  } catch (error) {
    console.error(
      "Acknowledge company response error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to acknowledge company response.",
    });
  }
};

// ======================================================
// Export
// ======================================================

module.exports = {
  checkCompanyResponses,
  acknowledgeCompanyResponse,
};