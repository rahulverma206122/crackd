const express = require("express");

const {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// Get All Notifications
// ======================================================

router.get(
  "/",
  authMiddleware,
  getNotifications
);

// ======================================================
// Get Unread Notification Count
// ======================================================

router.get(
  "/unread-count",
  authMiddleware,
  getUnreadNotificationCount
);

// ======================================================
// Mark One Notification As Read
// ======================================================

router.patch(
  "/:notificationId/read",
  authMiddleware,
  markNotificationAsRead
);

// ======================================================
// Mark All Notifications As Read
// ======================================================

router.patch(
  "/read-all",
  authMiddleware,
  markAllNotificationsAsRead
);

module.exports = router;