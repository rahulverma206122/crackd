const { google } = require("googleapis");

const EmailConnection = require("../models/EmailConnection");

const GMAIL_SCOPE =
  "https://www.googleapis.com/auth/gmail.readonly";

// ======================================================
// Create Google OAuth Client
// ======================================================

const createOAuthClient = () => {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REDIRECT_URI
  ) {
    throw new Error(
      "Google OAuth environment variables are not configured"
    );
  }

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

// ======================================================
// Get Gmail Client For User
// ======================================================

const getGmailClient = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const emailConnection =
    await EmailConnection.findOne({
      user: userId,
      provider: "gmail",
      connected: true,
    });

  if (!emailConnection) {
    throw new Error(
      "Gmail is not connected. Please connect Gmail first."
    );
  }

  if (!emailConnection.refreshToken) {
    throw new Error(
      "Gmail refresh token is missing. Please reconnect Gmail."
    );
  }

  const oauth2Client = createOAuthClient();

  // The refresh token allows Google to generate
  // a new access token when the old one expires.
  oauth2Client.setCredentials({
    access_token:
      emailConnection.accessToken || undefined,

    refresh_token:
      emailConnection.refreshToken,

    expiry_date:
      emailConnection.tokenExpiryDate
        ? new Date(
            emailConnection.tokenExpiryDate
          ).getTime()
        : undefined,
  });

  // Make sure the required Gmail scope exists.
  if (
    emailConnection.scope &&
    !emailConnection.scope.includes(
      GMAIL_SCOPE
    )
  ) {
    throw new Error(
      "Gmail read permission is not available. Please reconnect Gmail."
    );
  }

  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
  });

  return {
    gmail,
    emailConnection,
    oauth2Client,
  };
};

// ======================================================
// Get Connected Gmail Profile
// ======================================================

const getGmailProfile = async (userId) => {
  const { gmail } =
    await getGmailClient(userId);

  const response =
    await gmail.users.getProfile({
      userId: "me",
    });

  return response.data;
};

// ======================================================
// Get Recent Incoming Emails
// ======================================================

const getRecentEmails = async (
  userId,
  options = {}
) => {
  const {
    maxResults = 25,
    query = "newer_than:30d -from:me",
  } = options;

  const { gmail } =
    await getGmailClient(userId);

  const listResponse =
    await gmail.users.messages.list({
      userId: "me",
      maxResults,
      q: query,
    });

  const messages =
    listResponse.data.messages || [];

  if (messages.length === 0) {
    return [];
  }

  const emailPromises =
    messages.map(async (message) => {
      try {
        const response =
          await gmail.users.messages.get({
            userId: "me",
            id: message.id,
            format: "metadata",
            metadataHeaders: [
              "From",
              "To",
              "Subject",
              "Date",
              "Message-ID",
            ],
          });

        const data = response.data;

        const headers =
          data.payload?.headers || [];

        const getHeader = (name) => {
          const header = headers.find(
            (item) =>
              item.name?.toLowerCase() ===
              name.toLowerCase()
          );

          return header?.value || "";
        };

        return {
          id: data.id,
          threadId: data.threadId || "",
          historyId: data.historyId || "",

          from: getHeader("From"),
          to: getHeader("To"),
          subject: getHeader("Subject"),
          date: getHeader("Date"),
          messageId:
            getHeader("Message-ID"),

          snippet: data.snippet || "",

          internalDate: data.internalDate
            ? new Date(
                Number(data.internalDate)
              )
            : null,

          labelIds: data.labelIds || [],
        };
      } catch (error) {
        console.error(
          `Failed to fetch Gmail message ${message.id}:`,
          error.message
        );

        return null;
      }
    });

  const emails =
    await Promise.all(emailPromises);

  return emails.filter(Boolean);
};

// ======================================================
// Get Single Email
// ======================================================

const getEmailById = async (
  userId,
  messageId
) => {
  if (!messageId) {
    throw new Error(
      "Gmail message ID is required"
    );
  }

  const { gmail } =
    await getGmailClient(userId);

  const response =
    await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

  return response.data;
};

// ======================================================
// Get Emails Since Specific Date
// ======================================================

const getEmailsSince = async (
  userId,
  date
) => {
  if (!date) {
    throw new Error(
      "Date is required"
    );
  }

  const startDate = new Date(date);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error(
      "Invalid date provided"
    );
  }

  // Gmail's after query uses Unix timestamp
  // in seconds.
  const unixTimestamp = Math.floor(
    startDate.getTime() / 1000
  );

  const query = `after:${unixTimestamp} -from:me`;

  return getRecentEmails(userId, {
    maxResults: 50,
    query,
  });
};

// ======================================================
// Update Last Checked Time
// ======================================================

const updateLastCheckedAt = async (
  userId
) => {
  await EmailConnection.findOneAndUpdate(
    {
      user: userId,
      provider: "gmail",
    },
    {
      lastCheckedAt: new Date(),
    }
  );
};

// ======================================================
// Update Gmail Access Token
// ======================================================

const updateAccessToken = async (
  userId,
  accessToken,
  expiryDate
) => {
  if (!accessToken) {
    return;
  }

  await EmailConnection.findOneAndUpdate(
    {
      user: userId,
      provider: "gmail",
    },
    {
      accessToken,
      ...(expiryDate
        ? {
            tokenExpiryDate: new Date(
              expiryDate
            ),
          }
        : {}),
    }
  );
};

// ======================================================
// Export
// ======================================================

module.exports = {
  createOAuthClient,
  getGmailClient,
  getGmailProfile,
  getRecentEmails,
  getEmailById,
  getEmailsSince,
  updateLastCheckedAt,
  updateAccessToken,
};