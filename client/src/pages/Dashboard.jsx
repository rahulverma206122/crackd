import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import {
  connectGmail,
  getGmailStatus,
  disconnectGmail,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/api";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  // ======================================================
  // GMAIL STATE
  // ======================================================

  const [gmailConnected, setGmailConnected] =
    useState(false);

  const [gmailEmail, setGmailEmail] =
    useState("");

  const [gmailLoading, setGmailLoading] =
    useState(true);

  const [gmailActionLoading, setGmailActionLoading] =
    useState(false);

  const [gmailMessage, setGmailMessage] =
    useState("");

  const [gmailError, setGmailError] =
    useState("");

  // ======================================================
  // NOTIFICATION STATE
  // ======================================================

  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [notificationLoading, setNotificationLoading] =
    useState(true);

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [notificationActionLoading, setNotificationActionLoading] =
    useState(false);

  // ======================================================
  // GET TOKEN
  // ======================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken")
    );
  };

  // ======================================================
  // LOAD NOTIFICATIONS
  // ======================================================

  const loadNotifications = async () => {
    try {
      const token = getToken();

      if (!token) {
        setNotificationLoading(false);
        return;
      }

      const response =
        await getNotifications(token);

      setNotifications(
        response?.notifications || []
      );

      setUnreadCount(
        response?.unreadCount || 0
      );
    } catch (error) {
      console.error(
        "Notification loading error:",
        error
      );
    } finally {
      setNotificationLoading(false);
    }
  };

  // ======================================================
  // MARK ONE NOTIFICATION AS READ
  // ======================================================

  const handleMarkAsRead = async (
    notificationId
  ) => {
    try {
      const token = getToken();

      if (!token) {
        return;
      }

      await markNotificationAsRead(
        notificationId,
        token
      );

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );

      setUnreadCount((previous) =>
        Math.max(previous - 1, 0)
      );
    } catch (error) {
      console.error(
        "Mark notification as read error:",
        error
      );
    }
  };

  // ======================================================
  // MARK ALL NOTIFICATIONS AS READ
  // ======================================================

  const handleMarkAllAsRead = async () => {
    try {
      const token = getToken();

      if (!token || unreadCount === 0) {
        return;
      }

      setNotificationActionLoading(true);

      await markAllNotificationsAsRead(
        token
      );

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Mark all notifications as read error:",
        error
      );
    } finally {
      setNotificationActionLoading(false);
    }
  };

  // ======================================================
  // LOAD NOTIFICATIONS ON DASHBOARD
  // ======================================================

  useEffect(() => {
    loadNotifications();

    // Refresh notification count/list
    // every 30 seconds.
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ======================================================
  // CHECK GMAIL CONNECTION
  // ======================================================

  const checkGmailStatus = async () => {
    try {
      const token = getToken();

      if (!token) {
        setGmailLoading(false);
        return;
      }

      const response =
        await getGmailStatus(token);

      if (
        response?.connected &&
        response?.connection
      ) {
        setGmailConnected(true);

        setGmailEmail(
          response.connection.email || ""
        );
      } else {
        setGmailConnected(false);
        setGmailEmail("");
      }
    } catch (error) {
      console.error(
        "Gmail status error:",
        error
      );

      setGmailConnected(false);
      setGmailEmail("");
    } finally {
      setGmailLoading(false);
    }
  };

  // ======================================================
  // HANDLE GMAIL OAUTH RESULT
  // ======================================================

  useEffect(() => {
    const params = new URLSearchParams(
      location.search
    );

    const gmailStatus =
      params.get("gmail");

    if (gmailStatus === "connected") {
      setGmailMessage(
        "Gmail connected successfully! 🎉"
      );

      // Remove ?gmail=connected from URL
      navigate("/dashboard", {
        replace: true,
      });

      checkGmailStatus();

      const timer = setTimeout(() => {
        setGmailMessage("");
      }, 5000);

      return () => clearTimeout(timer);
    }

    if (gmailStatus === "denied") {
      setGmailError(
        "Gmail permission was denied."
      );

      navigate("/dashboard", {
        replace: true,
      });

      const timer = setTimeout(() => {
        setGmailError("");
      }, 5000);

      return () => clearTimeout(timer);
    }

    if (
      gmailStatus === "error" ||
      gmailStatus === "invalid-state" ||
      gmailStatus === "user-not-found"
    ) {
      setGmailError(
        "Unable to connect Gmail. Please try again."
      );

      navigate("/dashboard", {
        replace: true,
      });

      const timer = setTimeout(() => {
        setGmailError("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [
    location.search,
    navigate,
  ]);

  // ======================================================
  // LOAD GMAIL STATUS
  // ======================================================

  useEffect(() => {
    checkGmailStatus();
  }, []);

  // ======================================================
  // CONNECT GMAIL
  // ======================================================

  const handleConnectGmail = async () => {
    try {
      setGmailActionLoading(true);
      setGmailError("");
      setGmailMessage("");

      const token = getToken();

      if (!token) {
        setGmailError(
          "Please login again to connect Gmail."
        );
        return;
      }

      const response =
        await connectGmail(token);

      if (!response?.authorizationUrl) {
        throw new Error(
          "Google authorization URL was not received."
        );
      }

      // Redirect user to Google OAuth page
      window.location.href =
        response.authorizationUrl;
    } catch (error) {
      console.error(
        "Connect Gmail error:",
        error
      );

      setGmailError(
        error.message ||
          "Failed to connect Gmail."
      );
    } finally {
      setGmailActionLoading(false);
    }
  };

  // ======================================================
  // DISCONNECT GMAIL
  // ======================================================

  const handleDisconnectGmail = async () => {
    try {
      setGmailActionLoading(true);
      setGmailError("");
      setGmailMessage("");

      const token = getToken();

      if (!token) {
        setGmailError(
          "Please login again."
        );
        return;
      }

      await disconnectGmail(token);

      setGmailConnected(false);
      setGmailEmail("");

      setGmailMessage(
        "Gmail disconnected successfully."
      );

      setTimeout(() => {
        setGmailMessage("");
      }, 4000);
    } catch (error) {
      console.error(
        "Disconnect Gmail error:",
        error
      );

      setGmailError(
        error.message ||
          "Failed to disconnect Gmail."
      );
    } finally {
      setGmailActionLoading(false);
    }
  };

  // ======================================================
  // NOTIFICATION TIME FORMATTER
  // ======================================================

  const formatNotificationTime = (
    date
  ) => {
    if (!date) {
      return "";
    }

    const notificationDate =
      new Date(date);

    if (
      Number.isNaN(
        notificationDate.getTime()
      )
    ) {
      return "";
    }

    const now = new Date();

    const difference =
      now.getTime() -
      notificationDate.getTime();

    const minutes = Math.floor(
      difference / (1000 * 60)
    );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    if (days < 7) {
      return `${days}d ago`;
    }

    return notificationDate.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ======================================================
  // NOTIFICATION ICON
  // ======================================================

  const getNotificationIcon = (
    type
  ) => {
    switch (type) {
      case "company_response":
        return "📧";

      case "resume_processed":
        return "📄";

      case "resume_processing_failed":
        return "⚠️";

      case "interview_completed":
        return "🎤";

      case "interview_report_ready":
        return "📊";

      case "resume_default":
        return "⭐";

      default:
        return "🔔";
    }
  };

  // ======================================================
  // HANDLE NOTIFICATION CLICK
  // ======================================================

  const handleNotificationClick = async (
    notification
  ) => {
    if (!notification.isRead) {
      await handleMarkAsRead(
        notification._id
      );
    }

    setNotificationOpen(false);

    // Company response notifications
    // take the user to Job Applications.
    if (
      notification.type ===
      "company_response"
    ) {
      navigate("/job-applications");
      return;
    }

    // Resume-related notifications
    if (
      notification.type ===
        "resume_processed" ||
      notification.type ===
        "resume_processing_failed" ||
      notification.type ===
        "resume_default"
    ) {
      navigate("/resumes");
      return;
    }

    // Interview notifications
    if (
      notification.type ===
        "interview_completed" ||
      notification.type ===
        "interview_report_ready"
    ) {
      navigate("/interview-history");
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">

      {/* =========================
          Navbar
      ========================= */}

      <nav className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          {/* Logo */}

          <Link
            to="/dashboard"
            className="text-2xl font-bold tracking-tight text-stone-900"
          >
            Crackd
            <span className="text-orange-500">
              .ai
            </span>
          </Link>

          {/* User + Notifications + Logout */}

          <div className="flex items-center gap-4">

            {/* Notification Bell */}

            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setNotificationOpen(
                    (previous) =>
                      !previous
                  )
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-xl transition hover:border-orange-200 hover:bg-orange-50"
                aria-label="Notifications"
              >
                🔔

                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}

              {notificationOpen && (
                <div className="absolute right-0 top-12 z-50 w-[350px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-xl">

                  {/* Header */}

                  <div className="flex items-center justify-between border-b border-orange-100 px-4 py-3">

                    <div>
                      <h3 className="text-sm font-bold text-stone-900">
                        Notifications
                      </h3>

                      {unreadCount > 0 && (
                        <p className="mt-0.5 text-xs text-stone-500">
                          {unreadCount} unread
                        </p>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={
                          handleMarkAllAsRead
                        }
                        disabled={
                          notificationActionLoading
                        }
                        className="text-xs font-semibold text-orange-600 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {notificationActionLoading
                          ? "Updating..."
                          : "Mark all read"}
                      </button>
                    )}

                  </div>

                  {/* Notification List */}

                  <div className="max-h-[420px] overflow-y-auto">

                    {notificationLoading ? (
                      <div className="px-5 py-8 text-center text-sm text-stone-500">
                        Loading notifications...
                      </div>
                    ) : notifications.length ===
                      0 ? (
                      <div className="px-5 py-10 text-center">

                        <div className="text-3xl">
                          🔔
                        </div>

                        <p className="mt-3 text-sm font-medium text-stone-700">
                          No notifications yet
                        </p>

                        <p className="mt-1 text-xs leading-5 text-stone-500">
                          New updates will appear here.
                        </p>

                      </div>
                    ) : (
                      notifications.map(
                        (notification) => (
                          <button
                            key={
                              notification._id
                            }
                            type="button"
                            onClick={() =>
                              handleNotificationClick(
                                notification
                              )
                            }
                            className={`flex w-full items-start gap-3 border-b border-stone-100 px-4 py-4 text-left transition hover:bg-orange-50 ${
                              !notification.isRead
                                ? "bg-orange-50/70"
                                : "bg-white"
                            }`}
                          >

                            {/* Icon */}

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-lg">
                              {getNotificationIcon(
                                notification.type
                              )}
                            </div>

                            {/* Content */}

                            <div className="min-w-0 flex-1">

                              <div className="flex items-start justify-between gap-2">

                                <p
                                  className={`text-sm ${
                                    notification.isRead
                                      ? "font-medium text-stone-700"
                                      : "font-bold text-stone-900"
                                  }`}
                                >
                                  {notification.title}
                                </p>

                                {!notification.isRead && (
                                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                                )}

                              </div>

                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">
                                {notification.message}
                              </p>

                              <p className="mt-2 text-[11px] font-medium text-stone-400">
                                {formatNotificationTime(
                                  notification.createdAt
                                )}
                              </p>

                            </div>

                          </button>
                        )
                      )
                    )}

                  </div>

                </div>
              )}

            </div>

            <div className="hidden text-right sm:block">

              <p className="text-sm font-medium text-stone-800">
                {user?.name}
              </p>

              <p className="text-xs text-stone-500">
                Candidate
              </p>

            </div>

            <button
              onClick={logout}
              className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
            >
              Logout
            </button>

          </div>

        </div>
      </nav>

      {/* =========================
          Main Content
      ========================= */}

      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* =========================
            Welcome Section
        ========================= */}

        <section className="rounded-2xl border border-orange-100 bg-white p-7 shadow-sm">

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

            <div>

              <p className="text-sm font-medium text-orange-600">
                Candidate Dashboard
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                Welcome back, {user?.name} 👋
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500 sm:text-base">
                Prepare smarter for your next opportunity with
                AI-powered resume analysis, optimization and
                interview practice.
              </p>

            </div>

            {/* Quick Action */}

            <Link
              to="/interview"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
            >
              Start AI Interview →
            </Link>

          </div>

        </section>

        {/* =========================
            Gmail Notifications
        ========================= */}

        <section className="mt-6 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                📧
              </div>

              <div>

                <h2 className="text-lg font-bold text-stone-900">
                  Gmail Response Tracking
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-500">
                  Connect your Gmail account so Crackd.ai can
                  detect responses from companies you've applied to.
                </p>

                {gmailConnected &&
                  gmailEmail && (
                    <div className="mt-3 flex items-center gap-2">

                      <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

                      <span className="text-sm font-medium text-stone-700">
                        Connected:
                      </span>

                      <span className="text-sm text-stone-500">
                        {gmailEmail}
                      </span>

                    </div>
                  )}

              </div>

            </div>

            <div className="shrink-0">

              {gmailLoading ? (

                <div className="rounded-lg border border-stone-200 bg-stone-50 px-5 py-3 text-sm font-medium text-stone-500">
                  Checking Gmail...
                </div>

              ) : gmailConnected ? (

                <div className="flex flex-col gap-2 sm:flex-row">

                  <div className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700">
                    ✓ Gmail Connected
                  </div>

                  <button
                    onClick={
                      handleDisconnectGmail
                    }
                    disabled={
                      gmailActionLoading
                    }
                    className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {gmailActionLoading
                      ? "Disconnecting..."
                      : "Disconnect"}
                  </button>

                </div>

              ) : (

                <button
                  onClick={
                    handleConnectGmail
                  }
                  disabled={
                    gmailActionLoading
                  }
                  className="rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {gmailActionLoading
                    ? "Connecting..."
                    : "Connect Gmail →"}
                </button>

              )}

            </div>

          </div>

          {/* Success Message */}

          {gmailMessage && (
            <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {gmailMessage}
            </div>
          )}

          {/* Error Message */}

          {gmailError && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {gmailError}
            </div>
          )}

        </section>

        {/* =========================
            Quick Stats
        ========================= */}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">

          {/* Resume */}

          <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm">

            <p className="text-sm text-stone-500">
              Resume
            </p>

            <p className="mt-2 text-lg font-semibold text-stone-900">
              Manage your resumes
            </p>

            <Link
              to="/resumes"
              className="mt-3 inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              View resumes →
            </Link>

          </div>

          {/* Job Descriptions */}

          <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm">

            <p className="text-sm text-stone-500">
              Job Descriptions
            </p>

            <p className="mt-2 text-lg font-semibold text-stone-900">
              Manage your JDs
            </p>

            <Link
              to="/job-descriptions"
              className="mt-3 inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              View job descriptions →
            </Link>

          </div>

          {/* Interview */}

          <div className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm">

            <p className="text-sm text-stone-500">
              Interview
            </p>

            <p className="mt-2 text-lg font-semibold text-stone-900">
              Practice with AI
            </p>

            <Link
              to="/interview"
              className="mt-3 inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              Start practicing →
            </Link>

          </div>

        </div>

        {/* =========================
            Tools Section
        ========================= */}

        <div className="mt-10">

          <div className="mb-5">

            <h2 className="text-xl font-bold text-stone-900">
              Career Tools
            </h2>

            <p className="mt-1 text-sm text-stone-500">
              Everything you need to prepare for your next job.
            </p>

          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {/* =========================
                Resume Management
            ========================= */}

            <Link
              to="/resumes"
              className="group rounded-2xl border border-orange-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl">
                📄
              </div>

              <h3 className="mt-5 text-lg font-semibold text-stone-900">
                Resume Manager
              </h3>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Manage your uploaded resume versions, set a
                default resume and keep your applications organized.
              </p>

              <div className="mt-5 text-sm font-semibold text-orange-600 transition group-hover:text-orange-700">
                Manage resumes →
              </div>

            </Link>

            {/* =========================
                Job Descriptions
            ========================= */}

            <Link
              to="/job-descriptions"
              className="group rounded-2xl border border-orange-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl">
                💼
              </div>

              <h3 className="mt-5 text-lg font-semibold text-stone-900">
                Job Descriptions
              </h3>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Save and manage job descriptions for
                resume matching and interview preparation.
              </p>

              <div className="mt-5 text-sm font-semibold text-orange-600 transition group-hover:text-orange-700">
                Manage job descriptions →
              </div>

            </Link>

            {/* =========================
                Job Applications
            ========================= */}

            <Link
              to="/job-applications"
              className="group rounded-2xl border border-orange-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl">
                📋
              </div>

              <h3 className="mt-5 text-lg font-semibold text-stone-900">
                Job Applications
              </h3>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Track your job applications, statuses,
                application dates and the resume used.
              </p>

              <div className="mt-5 text-sm font-semibold text-orange-600 transition group-hover:text-orange-700">
                Track applications →
              </div>

            </Link>

            {/* =========================
                Resume Analysis
            ========================= */}

            <Link
              to="/analysis"
              className="group rounded-2xl border border-orange-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl">
                🤖
              </div>

              <h3 className="mt-5 text-lg font-semibold text-stone-900">
                AI Resume Analysis
              </h3>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Compare your resume with a job description
                and get an AI-powered ATS analysis.
              </p>

              <div className="mt-5 text-sm font-semibold text-orange-600 transition group-hover:text-orange-700">
                Analyze resume →
              </div>

            </Link>

            {/* =========================
                Resume Optimization
            ========================= */}

            <Link
              to="/resume-optimization"
              className="group rounded-2xl border border-orange-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl">
                ✨
              </div>

              <h3 className="mt-5 text-lg font-semibold text-stone-900">
                AI Resume Optimization
              </h3>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Get AI-powered suggestions to improve your
                resume without fabricating experience.
              </p>

              <div className="mt-5 text-sm font-semibold text-orange-600 transition group-hover:text-orange-700">
                Optimize resume →
              </div>

            </Link>

            {/* =========================
                AI Interview
            ========================= */}

            <Link
              to="/interview"
              className="group rounded-2xl border border-orange-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl">
                🎤
              </div>

              <h3 className="mt-5 text-lg font-semibold text-stone-900">
                AI Interviewer
              </h3>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Practice technical, behavioral and project
                interviews with an AI interviewer.
              </p>

              <div className="mt-5 text-sm font-semibold text-orange-600 transition group-hover:text-orange-700">
                Start interview →
              </div>

            </Link>

            {/* =========================
                Progress Tracking
            ========================= */}

            <Link
              to="/progress"
              className="group rounded-2xl border border-orange-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl">
                📈
              </div>

              <h3 className="mt-5 text-lg font-semibold text-stone-900">
                Progress Tracking
              </h3>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Track your interview scores, answer match and improvement over time.
              </p>

              <div className="mt-5 text-sm font-semibold text-orange-600 transition group-hover:text-orange-700">
                View progress →
              </div>

            </Link>

            {/* =========================
                Interview History
            ========================= */}

            <Link
              to="/interview-history"
              className="group rounded-2xl border border-orange-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl">
                📊
              </div>

              <h3 className="mt-5 text-lg font-semibold text-stone-900">
                Interview History
              </h3>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Review your previous interviews, scores,
                answers and AI evaluations.
              </p>

              <div className="mt-5 text-sm font-semibold text-orange-600 transition group-hover:text-orange-700">
                View interview history →
              </div>

            </Link>

          </div>

        </div>

        {/* =========================
            Bottom CTA
        ========================= */}

        <section className="mt-10 rounded-2xl border border-orange-200 bg-white p-7 shadow-sm">

          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">

            <div>

              <h2 className="text-xl font-bold text-stone-900">
                Ready for your next interview?
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                Upload your resume and start practicing with
                your AI interviewer.
              </p>

            </div>

            <Link
              to="/interview"
              className="rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Practice Interview →
            </Link>

          </div>

        </section>

      </main>

    </div>
  );
};

export default Dashboard;