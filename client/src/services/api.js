const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const request = async (
  endpoint,
  options = {}
) => {
  let response;

  // ======================================================
  // SEND REQUEST
  // ======================================================

  try {
    response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,

        headers: {
          ...(options.body instanceof FormData
            ? {}
            : {
                "Content-Type":
                  "application/json",
              }),

          ...(options.headers || {}),
        },
      }
    );
  } catch (error) {
    console.error(
      "API request failed:",
      error
    );

    throw new Error(
      "Unable to connect to the server. Please check your internet connection and try again."
    );
  }

  // ======================================================
  // READ RESPONSE SAFELY
  // ======================================================

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  let data = null;

  // ------------------------------------------------------
  // JSON RESPONSE
  // ------------------------------------------------------

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    try {
      data = await response.json();
    } catch (error) {
      console.error(
        "Failed to parse JSON response:",
        error
      );

      data = null;
    }
  }

  // ------------------------------------------------------
  // NON-JSON RESPONSE
  // ------------------------------------------------------

  else {
    try {
      const text =
        await response.text();

      data = {
        message: text,
      };
    } catch (error) {
      console.error(
        "Failed to read response:",
        error
      );

      data = null;
    }
  }

  // ======================================================
  // HANDLE HTTP ERRORS
  // ======================================================

  if (!response.ok) {
    // ----------------------------------------------------
    // RENDER / PROXY TEMPORARY ERRORS
    // ----------------------------------------------------

    if (
      response.status === 502 ||
      response.status === 503 ||
      response.status === 504
    ) {
      throw new Error(
        "The AI service is temporarily unavailable. Please try again in a moment."
      );
    }

    // ----------------------------------------------------
    // NORMAL API ERROR
    // ----------------------------------------------------

    throw new Error(
      data?.message ||
        data?.detail ||
        "Something went wrong. Please try again."
    );
  }

  // ======================================================
  // SUCCESS
  // ======================================================

  return data;
};

// ======================================================
// AUTH APIs
// ======================================================

export const registerUser = (
  userData
) => {
  return request(
    "/auth/register",
    {
      method: "POST",

      body: JSON.stringify(
        userData
      ),
    }
  );
};

export const loginUser = (
  userData
) => {
  return request(
    "/auth/login",
    {
      method: "POST",

      body: JSON.stringify(
        userData
      ),
    }
  );
};

export const getCurrentUser = (
  token
) => {
  return request(
    "/auth/me",
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ======================================================
// RESUME APIs
// ======================================================

export const uploadResume = (
  file,
  token
) => {
  const formData =
    new FormData();

  formData.append(
    "resume",
    file
  );

  return request(
    "/resumes/upload",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: formData,
    }
  );
};

export const getResumes = (
  token
) => {
  return request(
    "/resumes",
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const getResumeById = (
  resumeId,
  token
) => {
  return request(
    `/resumes/${resumeId}`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const deleteResume = (
  resumeId,
  token
) => {
  return request(
    `/resumes/${resumeId}`,
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ======================================================
// JOB DESCRIPTION APIs
// ======================================================

export const createJobDescription = (
  jobData,
  token
) => {
  return request(
    "/job-descriptions",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(
        jobData
      ),
    }
  );
};

export const uploadJobDescription = (
  file,
  metadata,
  token
) => {
  const formData =
    new FormData();

  formData.append(
    "jobDescription",
    file
  );

  formData.append(
    "title",
    metadata.title
  );

  formData.append(
    "company",
    metadata.company
  );

  formData.append(
    "role",
    metadata.role
  );

  return request(
    "/job-descriptions/upload",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: formData,
    }
  );
};

export const getJobDescriptions = (
  token
) => {
  return request(
    "/job-descriptions",
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const getJobDescriptionById = (
  id,
  token
) => {
  return request(
    `/job-descriptions/${id}`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const deleteJobDescription = (
  id,
  token
) => {
  return request(
    `/job-descriptions/${id}`,
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ======================================================
// AI RESUME ANALYSIS APIs
// ======================================================

export const createAnalysis = (
  resumeId,
  jobDescriptionId,
  token
) => {
  return request(
    "/analyses",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        resumeId,
        jobDescriptionId,
      }),
    }
  );
};

export const getAnalyses = (
  token
) => {
  return request(
    "/analyses",
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const getAnalysisById = (
  analysisId,
  token
) => {
  return request(
    `/analyses/${analysisId}`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ======================================================
// AI RESUME OPTIMIZATION APIs
// ======================================================

export const createOptimization = (
  resumeId,
  jobDescriptionId,
  token
) => {
  return request(
    "/analyses/optimize",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        resumeId,
        jobDescriptionId,
      }),
    }
  );
};

export const getOptimizations = (
  token
) => {
  return request(
    "/analyses/optimizations",
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const getOptimizationById = (
  optimizationId,
  token
) => {
  return request(
    `/analyses/optimizations/${optimizationId}`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ======================================================
// INTERVIEW APIs
// ======================================================

// ------------------------------------------------------
// Start First Interview Round
// ------------------------------------------------------

export const createInterview = (
  resumeId,
  jobDescriptionId,
  interviewType,
  token
) => {
  return request(
    "/interviews",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        resumeId,

        // JD is optional
        jobDescriptionId:
          jobDescriptionId || null,

        interviewType:
          interviewType || "mixed",
      }),
    }
  );
};

// ------------------------------------------------------
// Submit Current Answer
// ------------------------------------------------------

export const submitInterviewAnswer = (
  interviewId,
  answer,
  token
) => {
  return request(
    "/interviews/answer",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        interviewId,
        answer,
      }),
    }
  );
};

// ------------------------------------------------------
// Start Next 10-Question Round
// ------------------------------------------------------

export const createNextInterviewBatch = (
  interviewId,
  token
) => {
  return request(
    "/interviews/next-batch",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        interviewId,
      }),
    }
  );
};

// ------------------------------------------------------
// Get Interview History
// GET /api/interviews
// ------------------------------------------------------

export const getInterviewHistory = (
  token
) => {
  return request(
    "/interviews",
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ------------------------------------------------------
// Get Single Interview Details
// GET /api/interviews/:interviewId
// ------------------------------------------------------

export const getInterviewDetails = (
  interviewId,
  token
) => {
  return request(
    `/interviews/${interviewId}`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ------------------------------------------------------
// Get Interview Performance Analytics
// GET /api/interviews/analytics
// ------------------------------------------------------

export const getInterviewAnalytics = (
  token
) => {
  return request(
    "/interviews/analytics",
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ------------------------------------------------------
// Transcribe Interview Audio
// POST /api/interviews/transcribe
// ------------------------------------------------------

export const transcribeInterviewAudio = (
  audioBlob,
  token
) => {
  if (!audioBlob) {
    throw new Error(
      "Audio recording is required"
    );
  }

  const formData =
    new FormData();

  formData.append(
    "file",
    audioBlob,
    "interview-answer.webm"
  );

  return request(
    "/interviews/transcribe",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: formData,
    }
  );
};

// ======================================================
// JOB APPLICATION APIs
// ======================================================

// ------------------------------------------------------
// Create Job Application
// POST /api/applications
// ------------------------------------------------------

export const createJobApplication = (
  applicationData,
  token
) => {
  return request(
    "/applications",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(
        applicationData
      ),
    }
  );
};

// ------------------------------------------------------
// Get All Job Applications
// GET /api/applications
// ------------------------------------------------------

export const getJobApplications = (
  token
) => {
  return request(
    "/applications",
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ------------------------------------------------------
// Get Single Job Application
// GET /api/applications/:applicationId
// ------------------------------------------------------

export const getJobApplicationById = (
  applicationId,
  token
) => {
  return request(
    `/applications/${applicationId}`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ------------------------------------------------------
// Update Job Application
// PUT /api/applications/:applicationId
// ------------------------------------------------------

export const updateJobApplication = (
  applicationId,
  applicationData,
  token
) => {
  return request(
    `/applications/${applicationId}`,
    {
      method: "PUT",

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(
        applicationData
      ),
    }
  );
};

// ------------------------------------------------------
// Delete Job Application
// DELETE /api/applications/:applicationId
// ------------------------------------------------------

export const deleteJobApplication = (
  applicationId,
  token
) => {
  return request(
    `/applications/${applicationId}`,
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ======================================================
// GMAIL APIs
// ======================================================

// ------------------------------------------------------
// Get Gmail OAuth connection URL
// GET /api/email/connect
// ------------------------------------------------------

export const connectGmail = (
  token
) => {
  return request(
    "/email/connect",
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ------------------------------------------------------
// Get Gmail connection status
// GET /api/email/status
// ------------------------------------------------------

export const getGmailStatus = (
  token
) => {
  return request(
    "/email/status",
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ------------------------------------------------------
// Disconnect Gmail
// DELETE /api/email/disconnect
// ------------------------------------------------------

export const disconnectGmail = (
  token
) => {
  return request(
    "/email/disconnect",
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ------------------------------------------------------
// Gmail OAuth callback result helper
// ------------------------------------------------------

export const getGmailConnectionResult = () => {
  const params = new URLSearchParams(
    window.location.search
  );

  return {
    status: params.get("gmail"),
  };
};

// ======================================================
// GMAIL RESPONSE MONITORING APIs
// ======================================================

// ------------------------------------------------------
// Check Gmail for Company Responses
// GET /api/email/check-responses
// ------------------------------------------------------

export const checkCompanyResponses = (
  token
) => {
  return request(
    "/email/check-responses",
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ------------------------------------------------------
// Acknowledge Company Response
// PATCH /api/email/applications/:applicationId/acknowledge
// ------------------------------------------------------

export const acknowledgeCompanyResponse = (
  applicationId,
  token
) => {
  return request(
    `/email/applications/${applicationId}/acknowledge`,
    {
      method: "PATCH",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ======================================================
// RESUME MANAGER APIs
// ======================================================

// ------------------------------------------------------
// Set Default Resume
// PATCH /api/resumes/:resumeId/default
// ------------------------------------------------------

export const setDefaultResume = (
  resumeId,
  token
) => {
  return request(
    `/resumes/${resumeId}/default`,
    {
      method: "PATCH",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ======================================================
// NOTIFICATION APIs
// ======================================================

// ------------------------------------------------------
// Get All Notifications
// GET /api/notifications
// ------------------------------------------------------

export const getNotifications = (
  token
) => {
  return request(
    "/notifications",
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ------------------------------------------------------
// Get Unread Notification Count
// GET /api/notifications/unread-count
// ------------------------------------------------------

export const getUnreadNotificationCount = (
  token
) => {
  return request(
    "/notifications/unread-count",
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ------------------------------------------------------
// Mark One Notification As Read
// PATCH /api/notifications/:notificationId/read
// ------------------------------------------------------

export const markNotificationAsRead = (
  notificationId,
  token
) => {
  return request(
    `/notifications/${notificationId}/read`,
    {
      method: "PATCH",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// ------------------------------------------------------
// Mark All Notifications As Read
// PATCH /api/notifications/read-all
// ------------------------------------------------------

export const markAllNotificationsAsRead = (
  token
) => {
  return request(
    "/notifications/read-all",
    {
      method: "PATCH",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};