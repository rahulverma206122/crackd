const JobApplication = require("../models/JobApplication");
const Resume = require("../models/Resume");
const JobDescription = require("../models/JobDescription");

// ============================================================
// CREATE JOB APPLICATION
// ============================================================

const createJobApplication = async (req, res) => {
  try {
    const {
      companyName,
      jobRole,
      applicationDate,
      jobDescription,
      resume,
      status,
      notes,
    } = req.body;

    if (!companyName || !jobRole || !resume) {
      return res.status(400).json({
        success: false,
        message:
          "Company name, job role, and resume are required",
      });
    }

    // ========================================================
    // FIND RESUME
    // ========================================================

    const resumeRecord =
      await Resume.findOne({
        _id: resume,
        user: req.user.userId,
      });

    if (!resumeRecord) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    // ========================================================
    // FIND JOB DESCRIPTION
    // JD IS OPTIONAL
    // ========================================================

    if (jobDescription) {
      const jdRecord =
        await JobDescription.findOne({
          _id: jobDescription,
          user: req.user.userId,
        });

      if (!jdRecord) {
        return res.status(404).json({
          success: false,
          message: "Job description not found",
        });
      }
    }

    // ========================================================
    // CREATE APPLICATION
    // ========================================================

    const application =
      await JobApplication.create({
        user: req.user.userId,

        companyName:
          companyName.trim(),

        jobRole:
          jobRole.trim(),

        applicationDate:
          applicationDate ||
          new Date(),

        jobDescription:
          jobDescription || null,

        resume,

        status:
          status || "Applied",

        notes:
          notes?.trim() || "",
      });

    // ========================================================
    // POPULATE RESPONSE
    // ========================================================

    const populatedApplication =
      await JobApplication.findById(
        application._id
      )
        .populate(
          "resume",
          "originalName fileName fileType fileSize"
        )
        .populate(
          "jobDescription"
        );

    return res.status(201).json({
      success: true,
      message:
        "Job application added successfully",
      application:
        populatedApplication,
    });
  } catch (error) {
    console.error(
      "Create job application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create job application",
    });
  }
};


// ============================================================
// GET ALL JOB APPLICATIONS
// ============================================================

const getJobApplications = async (
  req,
  res
) => {
  try {
    const applications =
      await JobApplication.find({
        user: req.user.userId,
      })
        .populate(
          "resume",
          "originalName fileName fileType fileSize"
        )
        .populate(
          "jobDescription"
        )
        .sort({
          applicationDate: -1,
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error(
      "Get job applications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch job applications",
    });
  }
};


// ============================================================
// GET SINGLE JOB APPLICATION
// ============================================================

const getJobApplicationById = async (
  req,
  res
) => {
  try {
    const application =
      await JobApplication.findOne({
        _id:
          req.params.applicationId,

        user:
          req.user.userId,
      })
        .populate(
          "resume",
          "originalName fileName fileType fileSize"
        )
        .populate(
          "jobDescription"
        );

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Job application not found",
      });
    }

    return res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    console.error(
      "Get job application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch job application",
    });
  }
};


// ============================================================
// UPDATE JOB APPLICATION
// ============================================================

const updateJobApplication = async (
  req,
  res
) => {
  try {
    const {
      companyName,
      jobRole,
      applicationDate,
      jobDescription,
      resume,
      status,
      notes,
      responseReceived,
      lastResponseDate,
    } = req.body;

    const application =
      await JobApplication.findOne({
        _id:
          req.params.applicationId,

        user:
          req.user.userId,
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Job application not found",
      });
    }

    // ========================================================
    // VALIDATE RESUME IF CHANGED
    // ========================================================

    if (
      resume &&
      resume !==
        application.resume.toString()
    ) {
      const resumeRecord =
        await Resume.findOne({
          _id: resume,
          user: req.user.userId,
        });

      if (!resumeRecord) {
        return res.status(404).json({
          success: false,
          message: "Resume not found",
        });
      }

      application.resume =
        resume;
    }

    // ========================================================
    // VALIDATE JOB DESCRIPTION IF CHANGED
    // ========================================================

    if (
      jobDescription !==
        undefined &&
      jobDescription !== null &&
      jobDescription !== ""
    ) {
      const jdRecord =
        await JobDescription.findOne({
          _id: jobDescription,
          user: req.user.userId,
        });

      if (!jdRecord) {
        return res.status(404).json({
          success: false,
          message:
            "Job description not found",
        });
      }

      application.jobDescription =
        jobDescription;
    } else if (
      jobDescription === null ||
      jobDescription === ""
    ) {
      application.jobDescription =
        null;
    }

    // ========================================================
    // UPDATE BASIC FIELDS
    // ========================================================

    if (
      companyName !== undefined
    ) {
      application.companyName =
        companyName.trim();
    }

    if (
      jobRole !== undefined
    ) {
      application.jobRole =
        jobRole.trim();
    }

    if (
      applicationDate !==
      undefined
    ) {
      application.applicationDate =
        applicationDate;
    }

    if (
      status !== undefined
    ) {
      application.status =
        status;
    }

    if (
      notes !== undefined
    ) {
      application.notes =
        notes.trim();
    }

    // ========================================================
    // RESPONSE TRACKING
    // ========================================================

    if (
      responseReceived !==
      undefined
    ) {
      application.responseReceived =
        responseReceived;

      if (
        responseReceived &&
        !application.lastResponseDate
      ) {
        application.lastResponseDate =
          new Date();
      }
    }

    if (
      lastResponseDate !==
      undefined
    ) {
      application.lastResponseDate =
        lastResponseDate;
    }

    await application.save();

    // ========================================================
    // POPULATE UPDATED APPLICATION
    // ========================================================

    const updatedApplication =
      await JobApplication.findById(
        application._id
      )
        .populate(
          "resume",
          "originalName fileName fileType fileSize"
        )
        .populate(
          "jobDescription"
        );

    return res.status(200).json({
      success: true,
      message:
        "Job application updated successfully",
      application:
        updatedApplication,
    });
  } catch (error) {
    console.error(
      "Update job application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update job application",
    });
  }
};


// ============================================================
// DELETE JOB APPLICATION
// ============================================================

const deleteJobApplication = async (
  req,
  res
) => {
  try {
    const application =
      await JobApplication.findOneAndDelete({
        _id:
          req.params.applicationId,

        user:
          req.user.userId,
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message:
          "Job application not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Job application deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete job application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to delete job application",
    });
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createJobApplication,
  getJobApplications,
  getJobApplicationById,
  updateJobApplication,
  deleteJobApplication,
};