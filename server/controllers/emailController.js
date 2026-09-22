const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
const EmailConnection = require("../models/EmailConnection");
const User = require("../models/User");

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

const getOAuthClient = () => {
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

// Generate Google OAuth URL
const connectGmail = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Make sure the user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const oauth2Client = getOAuthClient();

    // Create a short-lived signed state token.
    // This allows the callback to know which Crackd user
    // started the Gmail connection.
    const state = jwt.sign(
      {
        userId,
        purpose: "gmail-oauth",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      }
    );

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [GMAIL_SCOPE],
      state,
      include_granted_scopes: true,
    });

    return res.status(200).json({
      success: true,
      authorizationUrl,
    });
  } catch (error) {
    console.error("Gmail connect error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to connect Gmail",
    });
  }
};

// Google redirects here after user grants permission
const gmailCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // User denied Gmail permission
    if (error) {
      console.error("Google OAuth error:", error);

      return res.redirect(
        `${process.env.CLIENT_URL}/dashboard?gmail=denied`
      );
    }

    if (!code || !state) {
      return res.redirect(
        `${process.env.CLIENT_URL}/dashboard?gmail=error`
      );
    }

    // Verify the state token
    let decodedState;

    try {
      decodedState = jwt.verify(state, process.env.JWT_SECRET);
    } catch (stateError) {
      console.error("Invalid Gmail OAuth state:", stateError);

      return res.redirect(
        `${process.env.CLIENT_URL}/dashboard?gmail=invalid-state`
      );
    }

    if (decodedState.purpose !== "gmail-oauth") {
      return res.redirect(
        `${process.env.CLIENT_URL}/dashboard?gmail=invalid-state`
      );
    }

    const userId = decodedState.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.redirect(
        `${process.env.CLIENT_URL}/dashboard?gmail=user-not-found`
      );
    }

    const oauth2Client = getOAuthClient();

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error("Google did not return an access token");
    }

    oauth2Client.setCredentials(tokens);

    // Get the Gmail account connected by the user
    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const profileResponse = await gmail.users.getProfile({
      userId: "me",
    });

    const gmailProfile = profileResponse.data;

    const gmailAddress = gmailProfile.emailAddress;

    if (!gmailAddress) {
      throw new Error("Unable to determine Gmail address");
    }

    // Check if the user already has a Gmail connection
    let emailConnection = await EmailConnection.findOne({
      user: userId,
    });

    if (emailConnection) {
      emailConnection.email = gmailAddress;
      emailConnection.provider = "gmail";
      emailConnection.accessToken =
        tokens.access_token || emailConnection.accessToken;

      // Google may not return a refresh token every time.
      // Keep the existing one if it is not returned.
      if (tokens.refresh_token) {
        emailConnection.refreshToken = tokens.refresh_token;
      }

      emailConnection.tokenExpiryDate = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : emailConnection.tokenExpiryDate;

      emailConnection.scope =
        tokens.scope || emailConnection.scope || GMAIL_SCOPE;

      emailConnection.connected = true;

      await emailConnection.save();
    } else {
      emailConnection = await EmailConnection.create({
        user: userId,
        provider: "gmail",
        email: gmailAddress,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || "",
        tokenExpiryDate: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
        scope: tokens.scope || GMAIL_SCOPE,
        connected: true,
      });
    }

    console.log(`Gmail connected successfully for ${gmailAddress}`);

    return res.redirect(
      `${process.env.CLIENT_URL}/dashboard?gmail=connected`
    );
  } catch (error) {
    console.error("Gmail callback error:", error);

    return res.redirect(
      `${process.env.CLIENT_URL}/dashboard?gmail=error`
    );
  }
};

// Get Gmail connection status
const getGmailStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    const emailConnection = await EmailConnection.findOne({
      user: userId,
    }).select(
      "provider email connected tokenExpiryDate lastCheckedAt createdAt updatedAt"
    );

    if (!emailConnection || !emailConnection.connected) {
      return res.status(200).json({
        success: true,
        connected: false,
        connection: null,
      });
    }

    return res.status(200).json({
      success: true,
      connected: true,
      connection: emailConnection,
    });
  } catch (error) {
    console.error("Get Gmail status error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get Gmail status",
    });
  }
};

// Disconnect Gmail
const disconnectGmail = async (req, res) => {
  try {
    const userId = req.user.userId;

    const emailConnection = await EmailConnection.findOne({
      user: userId,
    });

    if (!emailConnection) {
      return res.status(404).json({
        success: false,
        message: "Gmail is not connected",
      });
    }

    // Try to revoke Google's token as well
    try {
      const oauth2Client = getOAuthClient();

      const tokenToRevoke =
        emailConnection.refreshToken || emailConnection.accessToken;

      if (tokenToRevoke) {
        await oauth2Client.revokeToken(tokenToRevoke);
      }
    } catch (revokeError) {
      // Even if Google token revocation fails,
      // we still disconnect the account locally.
      console.error(
        "Google token revoke warning:",
        revokeError.message
      );
    }

    await EmailConnection.deleteOne({
      _id: emailConnection._id,
    });

    return res.status(200).json({
      success: true,
      message: "Gmail disconnected successfully",
    });
  } catch (error) {
    console.error("Disconnect Gmail error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to disconnect Gmail",
    });
  }
};

module.exports = {
  connectGmail,
  gmailCallback,
  getGmailStatus,
  disconnectGmail,
};