import { useEffect, useMemo, useState } from "react";

import {
  createJobApplication,
  getJobApplications,
  updateJobApplication,
  deleteJobApplication,
  getResumes,
  getJobDescriptions,
  checkCompanyResponses,
  acknowledgeCompanyResponse,
} from "../services/api";

import { useAuth } from "../context/AuthContext";


const STATUS_OPTIONS = [
  "Applied",
  "Assessment",
  "Recruiter Contacted",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
  "No Response",
];


const getStatusClasses = (status) => {
  switch (status) {
    case "Applied":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "Assessment":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";

    case "Recruiter Contacted":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "Interview":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "Offer":
      return "bg-green-50 text-green-700 border-green-200";

    case "Rejected":
      return "bg-red-50 text-red-700 border-red-200";

    case "Withdrawn":
      return "bg-gray-100 text-gray-700 border-gray-200";

    case "No Response":
      return "bg-gray-50 text-gray-600 border-gray-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};


const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};


const formatDateTime = (date) => {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};


const getInputDate = (date) => {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();

  const month = String(
    parsedDate.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    parsedDate.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


const getTodayInputDate = () => {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


const emptyForm = {
  companyName: "",
  jobRole: "",
  applicationDate: getTodayInputDate(),
  jobDescription: "",
  resume: "",
  status: "Applied",
  notes: "",
};


const JobApplications = () => {
  const { token } = useAuth();

  const [
    applications,
    setApplications,
  ] = useState([]);

  const [
    resumes,
    setResumes,
  ] = useState([]);

  const [
    jobDescriptions,
    setJobDescriptions,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingOptions,
    setLoadingOptions,
  ] = useState(true);

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    formData,
    setFormData,
  ] = useState(emptyForm);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    updatingStatusId,
    setUpdatingStatusId,
  ] = useState(null);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  // ======================================================
  // GMAIL RESPONSE MONITORING STATE
  // ======================================================

  const [
    checkingResponses,
    setCheckingResponses,
  ] = useState(false);

  const [
    gmailError,
    setGmailError,
  ] = useState("");

  const [
    responsePopup,
    setResponsePopup,
  ] = useState(null);

  const [
    selectedResponse,
    setSelectedResponse,
  ] = useState(null);

  const [
    acknowledgingId,
    setAcknowledgingId,
  ] = useState(null);


  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    loadApplications();
    loadFormOptions();
  }, [token]);


  // ======================================================
  // CHECK GMAIL RESPONSES
  // ======================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    const runInitialCheck = async () => {
      try {
        await checkResponses(false);
      } catch (error) {
        if (isMounted) {
          console.error(
            "Initial Gmail response check failed:",
            error
          );
        }
      }
    };

    runInitialCheck();

    const intervalId = setInterval(() => {
      checkResponses(true);
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [token]);


  // ======================================================
  // LOAD APPLICATIONS
  // ======================================================

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getJobApplications(token);

      setApplications(
        response.applications || []
      );
    } catch (error) {
      console.error(
        "Failed to load applications:",
        error
      );

      setError(
        error.message ||
          "Failed to load job applications"
      );
    } finally {
      setLoading(false);
    }
  };


  // ======================================================
  // LOAD FORM OPTIONS
  // ======================================================

  const loadFormOptions = async () => {
    try {
      setLoadingOptions(true);

      const [
        resumeResponse,
        jdResponse,
      ] = await Promise.all([
        getResumes(token),
        getJobDescriptions(token),
      ]);

      setResumes(
        resumeResponse.resumes || []
      );

      setJobDescriptions(
        jdResponse.jobDescriptions || []
      );
    } catch (error) {
      console.error(
        "Failed to load form options:",
        error
      );

      setError(
        error.message ||
          "Failed to load resumes and job descriptions"
      );
    } finally {
      setLoadingOptions(false);
    }
  };


  // ======================================================
  // CHECK COMPANY RESPONSES
  // ======================================================

  const checkResponses = async (
    showLoading = true
  ) => {
    if (!token) {
      return;
    }

    try {
      if (showLoading) {
        setCheckingResponses(true);
      }

      setGmailError("");

      const response =
        await checkCompanyResponses(token);

      const detectedResponses =
        response.detectedResponses || [];

      if (detectedResponses.length > 0) {
        const firstResponse =
          detectedResponses[0];

        setResponsePopup(firstResponse);

        // Refresh applications so the NEW RESPONSE
        // badge and response details appear immediately.
        const applicationsResponse =
          await getJobApplications(token);

        setApplications(
          applicationsResponse.applications || []
        );
      }
    } catch (error) {
      console.error(
        "Gmail response check failed:",
        error
      );

      const message =
        error.message || "";

      // Gmail may simply not be connected.
      // Don't show a scary error on every automatic check.
      if (
        !message.toLowerCase().includes(
          "gmail is not connected"
        ) &&
        !message.toLowerCase().includes(
          "refresh token"
        )
      ) {
        setGmailError(message);
      }
    } finally {
      if (showLoading) {
        setCheckingResponses(false);
      }
    }
  };


  // ======================================================
  // OPEN RESPONSE
  // ======================================================

  const handleViewResponse = async (
    application
  ) => {
    setSelectedResponse(application);

    if (
      application.responseReceived &&
      !application.responseAcknowledged
    ) {
      try {
        setAcknowledgingId(
          application._id
        );

        await acknowledgeCompanyResponse(
          application._id,
          token
        );

        setApplications(
          (previous) =>
            previous.map((item) =>
              item._id === application._id
                ? {
                    ...item,
                    responseAcknowledged: true,
                  }
                : item
            )
        );

        setResponsePopup(null);
      } catch (error) {
        console.error(
          "Failed to acknowledge response:",
          error
        );
      } finally {
        setAcknowledgingId(null);
      }
    }
  };


  // ======================================================
  // CLOSE RESPONSE MODAL
  // ======================================================

  const closeResponseModal = () => {
    setSelectedResponse(null);
  };


  // ======================================================
  // FILTERED APPLICATIONS
  // ======================================================

  const filteredApplications =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      return applications.filter(
        (application) => {
          const company =
            application.companyName
              ?.toLowerCase() ||
            "";

          const role =
            application.jobRole
              ?.toLowerCase() ||
            "";

          const matchesSearch =
            !normalizedSearch ||
            company.includes(
              normalizedSearch
            ) ||
            role.includes(
              normalizedSearch
            );

          const matchesStatus =
            statusFilter === "All" ||
            application.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      applications,
      searchTerm,
      statusFilter,
    ]);


  // ======================================================
  // STATS
  // ======================================================

  const stats = useMemo(() => {
    const total =
      applications.length;

    const active =
      applications.filter(
        (application) =>
          ![
            "Rejected",
            "Withdrawn",
            "Offer",
          ].includes(
            application.status
          )
      ).length;

    const interviews =
      applications.filter(
        (application) =>
          application.status ===
          "Interview"
      ).length;

    const offers =
      applications.filter(
        (application) =>
          application.status ===
          "Offer"
      ).length;

    const rejected =
      applications.filter(
        (application) =>
          application.status ===
          "Rejected"
      ).length;

    const newResponses =
      applications.filter(
        (application) =>
          application.responseReceived &&
          !application.responseAcknowledged
      ).length;

    return {
      total,
      active,
      interviews,
      offers,
      rejected,
      newResponses,
    };
  }, [applications]);


  // ======================================================
  // FORM INPUT
  // ======================================================

  const handleInputChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setFormData(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };


  // ======================================================
  // RESET FORM
  // ======================================================

  const resetForm = () => {
    setFormData({
      ...emptyForm,
      applicationDate:
        getTodayInputDate(),
    });

    setEditingId(null);
    setShowForm(false);
  };


  // ======================================================
  // SUBMIT APPLICATION
  // ======================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !formData.companyName.trim() ||
        !formData.jobRole.trim()
      ) {
        setError(
          "Company name and job role are required."
        );
        return;
      }

      if (!formData.resume) {
        setError(
          "Please select the resume used for this application."
        );
        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccessMessage("");

        const payload = {
          companyName:
            formData.companyName.trim(),

          jobRole:
            formData.jobRole.trim(),

          applicationDate:
            formData.applicationDate,

          jobDescription:
            formData.jobDescription ||
            null,

          resume:
            formData.resume,

          status:
            formData.status,

          notes:
            formData.notes.trim(),
        };

        if (editingId) {
          const response =
            await updateJobApplication(
              editingId,
              payload,
              token
            );

          setApplications(
            (previous) =>
              previous.map(
                (application) =>
                  application._id ===
                  editingId
                    ? response.application
                    : application
              )
          );

          setSuccessMessage(
            "Application updated successfully."
          );
        } else {
          const response =
            await createJobApplication(
              payload,
              token
            );

          setApplications(
            (previous) => [
              response.application,
              ...previous,
            ]
          );

          setSuccessMessage(
            "Application added successfully."
          );
        }

        resetForm();
      } catch (error) {
        console.error(
          "Save application error:",
          error
        );

        setError(
          error.message ||
            "Failed to save application."
        );
      } finally {
        setSaving(false);
      }
    };


  // ======================================================
  // EDIT APPLICATION
  // ======================================================

  const handleEdit =
    (application) => {
      setError("");
      setSuccessMessage("");

      setEditingId(
        application._id
      );

      setFormData({
        companyName:
          application.companyName ||
          "",

        jobRole:
          application.jobRole ||
          "",

        applicationDate:
          getInputDate(
            application.applicationDate
          ),

        jobDescription:
          application
            .jobDescription?._id ||
          application.jobDescription ||
          "",

        resume:
          application.resume?._id ||
          application.resume ||
          "",

        status:
          application.status ||
          "Applied",

        notes:
          application.notes ||
          "",
      });

      setShowForm(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };


  // ======================================================
  // DELETE APPLICATION
  // ======================================================

  const handleDelete =
    async (applicationId) => {
      const shouldDelete =
        window.confirm(
          "Are you sure you want to delete this job application?"
        );

      if (!shouldDelete) {
        return;
      }

      try {
        setDeletingId(
          applicationId
        );

        setError("");
        setSuccessMessage("");

        await deleteJobApplication(
          applicationId,
          token
        );

        setApplications(
          (previous) =>
            previous.filter(
              (application) =>
                application._id !==
                applicationId
            )
        );

        setSuccessMessage(
          "Application deleted successfully."
        );
      } catch (error) {
        console.error(
          "Delete application error:",
          error
        );

        setError(
          error.message ||
            "Failed to delete application."
        );
      } finally {
        setDeletingId(null);
      }
    };


  // ======================================================
  // STATUS CHANGE
  // ======================================================

  const handleStatusChange =
    async (
      application,
      newStatus
    ) => {
      if (
        application.status ===
        newStatus
      ) {
        return;
      }

      try {
        setUpdatingStatusId(
          application._id
        );

        setError("");
        setSuccessMessage("");

        const response =
          await updateJobApplication(
            application._id,
            {
              status: newStatus,
            },
            token
          );

        setApplications(
          (previous) =>
            previous.map(
              (item) =>
                item._id ===
                application._id
                  ? response.application
                  : item
            )
        );

        setSuccessMessage(
          "Application status updated."
        );
      } catch (error) {
        console.error(
          "Update status error:",
          error
        );

        setError(
          error.message ||
            "Failed to update application status."
        );
      } finally {
        setUpdatingStatusId(
          null
        );
      }
    };


  // ======================================================
  // HELPERS
  // ======================================================

  const getResumeName =
    (application) => {
      if (
        application.resume
          ?.originalName
      ) {
        return application.resume
          .originalName;
      }

      return "Resume";
    };


  const getJobDescriptionName =
    (application) => {
      if (
        application.jobDescription
          ?.title
      ) {
        return application
          .jobDescription.title;
      }

      if (
        application.jobDescription
          ?.company
      ) {
        return application
          .jobDescription.company;
      }

      return "No JD linked";
    };


  const hasNewResponse =
    (application) =>
      Boolean(
        application.responseReceived &&
        !application.responseAcknowledged
      );


  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="min-h-screen bg-orange-50/30 px-4 py-6 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* ==================================================
            RESPONSE POPUP
        ================================================== */}

        {responsePopup && (
          <div className="fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm animate-in">

            <div className="rounded-xl border border-orange-200 bg-white p-5 shadow-2xl">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-lg">
                  📩
                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex items-start justify-between gap-2">

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                        New Response
                      </p>

                      <h3 className="mt-1 font-semibold text-gray-900">
                        Response received from{" "}
                        {responsePopup.companyName}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setResponsePopup(null)
                      }
                      className="text-gray-400 transition hover:text-gray-700"
                    >
                      ✕
                    </button>

                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    {responsePopup.jobRole}
                  </p>

                  {responsePopup.responseSubject && (
                    <p className="mt-2 truncate text-sm font-medium text-gray-800">
                      {responsePopup.responseSubject}
                    </p>
                  )}

                  {responsePopup.responseSnippet && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {responsePopup.responseSnippet}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const application =
                        applications.find(
                          (item) =>
                            item._id ===
                            responsePopup.applicationId
                        );

                      if (application) {
                        handleViewResponse(
                          application
                        );
                      }

                      setResponsePopup(null);
                    }}
                    className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-600"
                  >
                    View Response
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}


        {/* ==================================================
            RESPONSE DETAILS MODAL
        ================================================== */}

        {selectedResponse && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">

            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

              <div className="border-b border-gray-100 px-5 py-4">

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                      Company Response
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-gray-900">
                      {selectedResponse.companyName}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {selectedResponse.jobRole}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeResponseModal}
                    className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    ✕
                  </button>

                </div>

              </div>


              <div className="space-y-5 p-5">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    From
                  </p>

                  <p className="mt-1 break-all text-sm text-gray-800">
                    {selectedResponse.responseSender ||
                      "Unknown sender"}
                  </p>
                </div>


                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Subject
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {selectedResponse.responseSubject ||
                      "No subject"}
                  </p>
                </div>


                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Received
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {formatDateTime(
                      selectedResponse.lastResponseDate ||
                        selectedResponse.responseDate
                    )}
                  </p>
                </div>


                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Message Preview
                  </p>

                  <div className="mt-2 rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                    {selectedResponse.responseSnippet ||
                      "No message preview available."}
                  </div>
                </div>

              </div>


              <div className="flex justify-end border-t border-gray-100 px-5 py-4">

                <button
                  type="button"
                  onClick={closeResponseModal}
                  disabled={
                    acknowledgingId ===
                    selectedResponse._id
                  }
                  className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                >
                  {acknowledgingId ===
                  selectedResponse._id
                    ? "Updating..."
                    : "Close"}
                </button>

              </div>

            </div>

          </div>
        )}


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <p className="mb-1 text-sm font-medium text-orange-600">
              Career Management
            </p>

            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Job Applications
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Keep track of where you applied,
              which resume you used, and every
              stage of the application process.
            </p>

          </div>


          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={() =>
                checkResponses(true)
              }
              disabled={checkingResponses}
              className="inline-flex items-center justify-center rounded-lg border border-orange-200 bg-white px-4 py-3 text-sm font-semibold text-orange-700 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkingResponses
                ? "Checking Gmail..."
                : "↻ Check Gmail"}
            </button>


            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccessMessage("");

                if (showForm) {
                  resetForm();
                } else {
                  setFormData({
                    ...emptyForm,
                    applicationDate:
                      getTodayInputDate(),
                  });

                  setEditingId(null);
                  setShowForm(true);
                }
              }}
              className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
            >
              {showForm
                ? "Close Form"
                : "+ Add Application"}
            </button>

          </div>

        </div>


        {/* ==================================================
            GMAIL STATUS
        ================================================== */}

        {gmailError && (
          <div className="mb-5 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Gmail monitoring:
            {" "}
            {gmailError}
          </div>
        )}


        {/* ==================================================
            MESSAGES
        ================================================== */}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}


        {/* ==================================================
            FORM
        ================================================== */}

        {showForm && (
          <div className="mb-7 rounded-xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5">

              <h2 className="text-lg font-semibold text-gray-900">
                {editingId
                  ? "Edit Application"
                  : "Add Job Application"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Save the details of the job
                application and the exact resume
                you used.
              </p>

            </div>


            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* COMPANY */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Company Name *
                  </label>

                  <input
                    type="text"
                    name="companyName"
                    value={
                      formData.companyName
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="e.g. Google"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    required
                  />

                </div>


                {/* ROLE */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Job Role *
                  </label>

                  <input
                    type="text"
                    name="jobRole"
                    value={
                      formData.jobRole
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="e.g. Software Engineer"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    required
                  />

                </div>


                {/* APPLICATION DATE */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Application Date *
                  </label>

                  <input
                    type="date"
                    name="applicationDate"
                    value={
                      formData.applicationDate
                    }
                    onChange={
                      handleInputChange
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    required
                  />

                </div>


                {/* STATUS */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      formData.status
                    }
                    onChange={
                      handleInputChange
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  >
                    {STATUS_OPTIONS.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      )
                    )}
                  </select>

                </div>


                {/* RESUME */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Resume Used *
                  </label>

                  <select
                    name="resume"
                    value={
                      formData.resume
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={
                      loadingOptions
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100"
                    required
                  >

                    <option value="">
                      {loadingOptions
                        ? "Loading resumes..."
                        : "Select resume"}
                    </option>

                    {resumes.map(
                      (resume) => (
                        <option
                          key={resume._id}
                          value={
                            resume._id
                          }
                        >
                          {resume.originalName ||
                            resume.fileName}
                        </option>
                      )
                    )}

                  </select>


                  {!loadingOptions &&
                    resumes.length ===
                      0 && (
                      <p className="mt-1.5 text-xs text-red-600">
                        Upload a resume before
                        adding an application.
                      </p>
                    )}

                </div>


                {/* JOB DESCRIPTION */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Job Description
                  </label>

                  <select
                    name="jobDescription"
                    value={
                      formData.jobDescription
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={
                      loadingOptions
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100"
                  >

                    <option value="">
                      {loadingOptions
                        ? "Loading job descriptions..."
                        : "Select JD (optional)"}
                    </option>

                    {jobDescriptions.map(
                      (jd) => (
                        <option
                          key={jd._id}
                          value={jd._id}
                        >
                          {jd.title ||
                            jd.company ||
                            jd.role ||
                            "Job Description"}
                        </option>
                      )
                    )}

                  </select>

                </div>


                {/* NOTES */}

                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={
                      formData.notes
                    }
                    onChange={
                      handleInputChange
                    }
                    rows={4}
                    placeholder="Recruiter name, referral, interview notes, etc."
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />

                </div>

              </div>


              {/* FORM BUTTONS */}

              <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    loadingOptions ||
                    resumes.length === 0
                  }
                  className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Application"
                    : "Save Application"}
                </button>

              </div>

            </form>

          </div>
        )}


        {/* ==================================================
            STATS
        ================================================== */}

        <div className="mb-7 grid grid-cols-2 gap-4 md:grid-cols-6">

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Total
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">
              {stats.total}
            </p>
          </div>


          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Active
            </p>

            <p className="mt-1 text-2xl font-bold text-orange-600">
              {stats.active}
            </p>
          </div>


          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Interviews
            </p>

            <p className="mt-1 text-2xl font-bold text-purple-600">
              {stats.interviews}
            </p>
          </div>


          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Offers
            </p>

            <p className="mt-1 text-2xl font-bold text-green-600">
              {stats.offers}
            </p>
          </div>


          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Rejected
            </p>

            <p className="mt-1 text-2xl font-bold text-red-600">
              {stats.rejected}
            </p>
          </div>


          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">

            <p className="text-xs font-medium uppercase tracking-wide text-orange-600">
              New Responses
            </p>

            <p className="mt-1 text-2xl font-bold text-orange-700">
              {stats.newResponses}
            </p>

          </div>

        </div>


        {/* ==================================================
            FILTERS
        ================================================== */}

        <div className="mb-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 md:flex-row">

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search company or role..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 md:flex-1"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >

              <option value="All">
                All Statuses
              </option>

              {STATUS_OPTIONS.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                )
              )}

            </select>

          </div>

        </div>


        {/* ==================================================
            APPLICATIONS
        ================================================== */}

        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">

          <div className="border-b border-gray-100 px-5 py-4">

            <h2 className="font-semibold text-gray-900">
              Your Applications
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {filteredApplications.length}{" "}
              application
              {filteredApplications.length !==
              1
                ? "s"
                : ""}{" "}
              shown
            </p>

          </div>


          {loading ? (

            <div className="flex min-h-[220px] items-center justify-center px-5">

              <div className="text-center">

                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

                <p className="text-sm text-gray-500">
                  Loading applications...
                </p>

              </div>

            </div>

          ) : filteredApplications.length ===
            0 ? (

            <div className="px-5 py-16 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-2xl">
                📋
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                No applications found
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                Start tracking your job
                applications so you always know
                where you applied and which resume
                you used.
              </p>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccessMessage("");
                  setShowForm(true);
                }}
                className="mt-5 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                + Add Your First Application
              </button>

            </div>

          ) : (

            <>

              {/* ==================================================
                  DESKTOP TABLE
              ================================================== */}

              <div className="hidden overflow-x-auto lg:block">

                <table className="w-full min-w-[1050px]">

                  <thead>

                    <tr className="border-b border-gray-100 bg-gray-50/70 text-left">

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Company
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Role
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Applied
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Resume Used
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Response
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Actions
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredApplications.map(
                      (application) => (

                        <tr
                          key={
                            application._id
                          }
                          className={`border-b border-gray-100 last:border-0 hover:bg-orange-50/30 ${
                            hasNewResponse(
                              application
                            )
                              ? "bg-orange-50/40"
                              : ""
                          }`}
                        >

                          {/* COMPANY */}

                          <td className="px-5 py-4">

                            <div className="flex items-start gap-2">

                              <div>
                                <p className="font-semibold text-gray-900">
                                  {
                                    application.companyName
                                  }
                                </p>

                                {hasNewResponse(
                                  application
                                ) && (
                                  <span className="mt-1 inline-flex animate-pulse items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-red-600">
                                    ● NEW RESPONSE
                                  </span>
                                )}
                              </div>

                            </div>

                          </td>


                          {/* ROLE */}

                          <td className="px-5 py-4">

                            <p className="text-sm text-gray-700">
                              {
                                application.jobRole
                              }
                            </p>

                            {application.jobDescription && (
                              <p className="mt-1 text-xs text-gray-400">
                                JD:{" "}
                                {getJobDescriptionName(
                                  application
                                )}
                              </p>
                            )}

                          </td>


                          {/* DATE */}

                          <td className="px-5 py-4 text-sm text-gray-600">
                            {formatDate(
                              application.applicationDate
                            )}
                          </td>


                          {/* RESUME */}

                          <td className="px-5 py-4">

                            <p
                              className="max-w-[190px] truncate text-sm text-gray-700"
                              title={getResumeName(
                                application
                              )}
                            >
                              📄{" "}
                              {getResumeName(
                                application
                              )}
                            </p>

                          </td>


                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <select
                              value={
                                application.status ||
                                "Applied"
                              }
                              onChange={(event) =>
                                handleStatusChange(
                                  application,
                                  event.target.value
                                )
                              }
                              disabled={
                                updatingStatusId ===
                                application._id
                              }
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none ${getStatusClasses(
                                application.status
                              )}`}
                            >

                              {STATUS_OPTIONS.map(
                                (status) => (
                                  <option
                                    key={
                                      status
                                    }
                                    value={
                                      status
                                    }
                                  >
                                    {status}
                                  </option>
                                )
                              )}

                            </select>

                          </td>


                          {/* RESPONSE */}

                          <td className="px-5 py-4">

                            {application.responseReceived ? (

                              <div className="min-w-[190px]">

                                <p className="max-w-[190px] truncate text-xs font-medium text-gray-800">
                                  {application.responseSubject ||
                                    "Company response received"}
                                </p>

                                <p className="mt-1 max-w-[190px] truncate text-[11px] text-gray-500">
                                  {application.responseSender ||
                                    "Unknown sender"}
                                </p>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleViewResponse(
                                      application
                                    )
                                  }
                                  disabled={
                                    acknowledgingId ===
                                    application._id
                                  }
                                  className={`mt-2 text-xs font-semibold ${
                                    hasNewResponse(
                                      application
                                    )
                                      ? "text-orange-600 hover:text-orange-700"
                                      : "text-gray-600 hover:text-gray-900"
                                  }`}
                                >
                                  {acknowledgingId ===
                                  application._id
                                    ? "Opening..."
                                    : "View Response →"}
                                </button>

                              </div>

                            ) : (

                              <span className="text-xs text-gray-400">
                                No response yet
                              </span>

                            )}

                          </td>


                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    application
                                  )
                                }
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    application._id
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  application._id
                                }
                                className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                {deletingId ===
                                application._id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>


              {/* ==================================================
                  MOBILE
              ================================================== */}

              <div className="grid gap-4 p-4 lg:hidden">

                {filteredApplications.map(
                  (application) => (

                    <div
                      key={
                        application._id
                      }
                      className={`rounded-xl border p-4 ${
                        hasNewResponse(
                          application
                        )
                          ? "border-orange-300 bg-orange-50/40"
                          : "border-gray-200"
                      }`}
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <h3 className="font-semibold text-gray-900">
                            {
                              application.companyName
                            }
                          </h3>

                          <p className="mt-1 text-sm text-gray-600">
                            {
                              application.jobRole
                            }
                          </p>

                          {hasNewResponse(
                            application
                          ) && (
                            <span className="mt-2 inline-flex animate-pulse rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold tracking-wide text-red-600">
                              ● NEW RESPONSE
                            </span>
                          )}

                        </div>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                            application.status
                          )}`}
                        >
                          {
                            application.status
                          }
                        </span>

                      </div>


                      <div className="mt-4 space-y-3 text-sm">

                        <div>

                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Applied
                          </p>

                          <p className="mt-1 text-gray-700">
                            {formatDate(
                              application.applicationDate
                            )}
                          </p>

                        </div>


                        <div>

                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Resume Used
                          </p>

                          <p className="mt-1 break-all text-gray-700">
                            📄{" "}
                            {getResumeName(
                              application
                            )}
                          </p>

                        </div>


                        {application.jobDescription && (
                          <div>

                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                              Job Description
                            </p>

                            <p className="mt-1 text-gray-700">
                              {getJobDescriptionName(
                                application
                              )}
                            </p>

                          </div>
                        )}


                        {application.notes && (
                          <div>

                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                              Notes
                            </p>

                            <p className="mt-1 whitespace-pre-wrap text-gray-700">
                              {
                                application.notes
                              }
                            </p>

                          </div>
                        )}


                        {/* RESPONSE */}

                        {application.responseReceived && (
                          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">

                            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                              Company Response
                            </p>

                            <p className="mt-1 truncate text-sm font-medium text-gray-900">
                              {application.responseSubject ||
                                "Response received"}
                            </p>

                            <p className="mt-1 truncate text-xs text-gray-500">
                              {application.responseSender ||
                                "Unknown sender"}
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                handleViewResponse(
                                  application
                                )
                              }
                              disabled={
                                acknowledgingId ===
                                application._id
                              }
                              className="mt-2 text-xs font-semibold text-orange-600 hover:text-orange-700"
                            >
                              {acknowledgingId ===
                              application._id
                                ? "Opening..."
                                : "View Response →"}
                            </button>

                          </div>
                        )}


                        {/* CHANGE STATUS */}

                        <div>

                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                            Change Status
                          </p>

                          <select
                            value={
                              application.status ||
                              "Applied"
                            }
                            onChange={(event) =>
                              handleStatusChange(
                                application,
                                event.target.value
                              )
                            }
                            disabled={
                              updatingStatusId ===
                              application._id
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
                          >

                            {STATUS_OPTIONS.map(
                              (status) => (
                                <option
                                  key={
                                    status
                                  }
                                  value={
                                    status
                                  }
                                >
                                  {status}
                                </option>
                              )
                            )}

                          </select>

                        </div>

                      </div>


                      <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(
                              application
                            )
                          }
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              application._id
                            )
                          }
                          disabled={
                            deletingId ===
                            application._id
                          }
                          className="rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId ===
                          application._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            </>

          )}

        </div>

      </div>

    </div>
  );
};


export default JobApplications;