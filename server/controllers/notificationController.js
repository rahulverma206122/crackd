const Notification = require("../models/Notification");

// ======================================================
// Get User Notifications
// ======================================================

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await Notification.find({
      user: userId,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch notifications.",
    });
  }
};

// ======================================================
// Get Unread Notification Count
// ======================================================

const getUnreadNotificationCount = async (
  req,
  res
) => {
  try {
    const userId = req.user.userId;

    const unreadCount =
      await Notification.countDocuments({
        user: userId,
        isRead: false,
      });

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error(
      "Get unread notification count error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch unread notification count.",
    });
  }
};

// ======================================================
// Mark One Notification As Read
// ======================================================

const markNotificationAsRead = async (
  req,
  res
) => {
  try {
    const userId = req.user.userId;

    const { notificationId } =
      req.params;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message:
          "Notification ID is required.",
      });
    }

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          user: userId,
        },
        {
          $set: {
            isRead: true,
          },
        },
        {
          new: true,
        }
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error(
      "Mark notification as read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to mark notification as read.",
    });
  }
};

// ======================================================
// Mark All Notifications As Read
// ======================================================

const markAllNotificationsAsRead = async (
  req,
  res
) => {
  try {
    const userId = req.user.userId;

    await Notification.updateMany(
      {
        user: userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "All notifications marked as read.",
    });
  } catch (error) {
    console.error(
      "Mark all notifications as read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to mark all notifications as read.",
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};