
const Notification = require("../models/Notification");

// Get notifications for the logged-in student
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      student: req.user.id,
    }).sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      student: req.user.id,
      isRead: false,
    });

    return res.status(200).json({
      message: "Notifications fetched successfully",
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({
      message: "Unable to fetch notifications",
    });
  }
};

// Mark one notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        student: req.user.id,
      },
      {
        $set: { isRead: true },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark Notification Read Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid notification ID",
      });
    }

    return res.status(500).json({
      message: "Unable to update notification",
    });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
};
