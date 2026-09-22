const fs = require("fs");
const path = require("path");

const JobDescription = require("../models/JobDescription");
const extractResumeText = require("../services/resumeExtractionService");
const { indexDocument } = require("../services/aiService");


// ============================================================
// CREATE JD FROM PASTED TEXT
// ============================================================

const createJobDescription = async (req, res) => {
  try {
    const {
      title,
      company,
      role,
      descriptionText,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job description title is required",
      });
    }

    if (!descriptionText || !descriptionText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job description text is required",
      });
    }

    const jobDescription = await JobDescription.create({
      user: req.user.userId,

      title: title.trim(),

      company: company?.trim() || "",

      role: role?.trim() || "",

      sourceType: "text",

      descriptionText: descriptionText.trim(),
    });

    // ========================================================
    // RAG INDEXING
    // ========================================================
    //
    // The pasted JD is now stored in MongoDB.
    // Index the same text inside ChromaDB.
    //
    // JD text
    //   ↓
    // Node.js
    //   ↓
    // FastAPI /rag/index
    //   ↓
    // Chunking
    //   ↓
    // Local embeddings
    //   ↓
    // ChromaDB
    //
    // RAG failure must NOT make JD creation fail.
    // ========================================================

    try {
      await indexDocument(
        descriptionText.trim(),
        jobDescription._id.toString(),
        "job_description"
      );

      console.log(
        `RAG indexing completed for JD ${jobDescription._id}`
      );
    } catch (ragError) {
      console.error(
        "JD RAG indexing error:",
        ragError
      );
    }

    return res.status(201).json({
      success: true,
      message: "Job description saved successfully",
      jobDescription,
    });
  } catch (error) {
    console.error(
      "Create JD error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while saving job description",
    });
  }
};


// ============================================================
// UPLOAD JD PDF/DOCX
// ============================================================

const uploadJobDescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a PDF or DOCX job description",
      });
    }

    const {
      title,
      company,
      role,
    } = req.body;

    if (!title || !title.trim()) {
      if (
        req.file.path &&
        fs.existsSync(req.file.path)
      ) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(400).json({
        success: false,
        message:
          "Job description title is required",
      });
    }

    const extension = path
      .extname(req.file.originalname)
      .toLowerCase();

    const fileType =
      extension === ".pdf"
        ? "pdf"
        : "docx";

    let descriptionText = "";

    // ========================================================
    // EXTRACT JD TEXT
    // ========================================================

    try {
      descriptionText =
        await extractResumeText(
          req.file.path,
          fileType
        );
    } catch (extractionError) {
      console.error(
        "JD extraction error:",
        extractionError
      );

      if (
        req.file.path &&
        fs.existsSync(req.file.path)
      ) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(400).json({
        success: false,
        message:
          "Could not extract text from this file. Please upload a text-based PDF/DOCX.",
      });
    }

    if (!descriptionText.trim()) {
      if (
        req.file.path &&
        fs.existsSync(req.file.path)
      ) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(400).json({
        success: false,
        message:
          "No readable text was found in this file",
      });
    }

    // ========================================================
    // SAVE JD TO MONGODB
    // ========================================================

    const jobDescription =
      await JobDescription.create({
        user: req.user.userId,

        title: title.trim(),

        company:
          company?.trim() || "",

        role:
          role?.trim() || "",

        sourceType: "file",

        originalName:
          req.file.originalname,

        fileName:
          req.file.filename,

        filePath:
          req.file.path,

        fileType,

        fileSize:
          req.file.size,

        descriptionText:
          descriptionText.trim(),
      });

    // ========================================================
    // RAG INDEXING
    // ========================================================
    //
    // The extracted JD text is now indexed in ChromaDB.
    //
    // Extracted JD
    //      ↓
    // Chunking
    //      ↓
    // Local embeddings
    //      ↓
    // ChromaDB
    //
    // RAG failure does NOT delete the successfully
    // saved JD.
    // ========================================================

    try {
      await indexDocument(
        descriptionText.trim(),
        jobDescription._id.toString(),
        "job_description"
      );

      console.log(
        `RAG indexing completed for JD ${jobDescription._id}`
      );
    } catch (ragError) {
      console.error(
        "JD RAG indexing error:",
        ragError
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Job description uploaded successfully",
      jobDescription,
    });
  } catch (error) {
    console.error(
      "Upload JD error:",
      error
    );

    if (
      req.file?.path &&
      fs.existsSync(req.file.path)
    ) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while uploading job description",
    });
  }
};


// ============================================================
// GET ALL JDs
// ============================================================

const getJobDescriptions = async (req, res) => {
  try {
    const jobDescriptions =
      await JobDescription.find({
        user: req.user.userId,
      })
        .select(
          "-descriptionText -filePath"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      jobDescriptions,
    });
  } catch (error) {
    console.error(
      "Get JDs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching job descriptions",
    });
  }
};


// ============================================================
// GET ONE JD INCLUDING TEXT
// ============================================================

const getJobDescriptionById = async (
  req,
  res
) => {
  try {
    const jobDescription =
      await JobDescription.findOne({
        _id: req.params.id,
        user: req.user.userId,
      }).select("-filePath");

    if (!jobDescription) {
      return res.status(404).json({
        success: false,
        message:
          "Job description not found",
      });
    }

    return res.status(200).json({
      success: true,
      jobDescription,
    });
  } catch (error) {
    console.error(
      "Get JD error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching job description",
    });
  }
};


// ============================================================
// DELETE JD
// ============================================================

const deleteJobDescription = async (
  req,
  res
) => {
  try {
    const jobDescription =
      await JobDescription.findOne({
        _id: req.params.id,
        user: req.user.userId,
      });

    if (!jobDescription) {
      return res.status(404).json({
        success: false,
        message:
          "Job description not found",
      });
    }

    if (
      jobDescription.filePath &&
      fs.existsSync(
        jobDescription.filePath
      )
    ) {
      fs.unlinkSync(
        jobDescription.filePath
      );
    }

    await jobDescription.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Job description deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete JD error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting job description",
    });
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createJobDescription,
  uploadJobDescription,
  getJobDescriptions,
  getJobDescriptionById,
  deleteJobDescription,
};