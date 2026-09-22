const fs = require("fs");
const path = require("path");

const Resume = require("../models/Resume");
const extractResumeText = require("../services/resumeExtractionService");
const { indexDocument } = require("../services/aiService");

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a PDF or DOCX resume",
      });
    }

    const extension = path
      .extname(req.file.originalname)
      .toLowerCase();

    const fileType =
      extension === ".pdf" ? "pdf" : "docx";

    // Check whether the user already has a resume.
    // If this is their first resume, make it the default automatically.
    const existingResumeCount = await Resume.countDocuments({
      user: req.user.userId,
    });

    const resume = await Resume.create({
      user: req.user.userId,

      originalName: req.file.originalname,

      fileName: req.file.filename,

      filePath: req.file.path,

      fileType,

      fileSize: req.file.size,

      extractionStatus: "pending",

      isDefault: existingResumeCount === 0,
    });

    try {
      const extractedText = await extractResumeText(
        req.file.path,
        fileType
      );

      resume.extractedText = extractedText;
      resume.extractionStatus = "completed";

      await resume.save();

      // ======================================================
      // RAG INDEXING
      // ======================================================
      //
      // The resume has been successfully extracted and saved.
      // Now send the extracted text to the Python AI service
      // so it can be:
      //
      // Resume text
      //      ↓
      // Chunking
      //      ↓
      // Local embeddings
      //      ↓
      // ChromaDB
      //
      // RAG failure should NOT make resume upload fail.
      // ======================================================

      try {
        await indexDocument(
          extractedText,
          resume._id.toString(),
          "resume"
        );

        console.log(
          `RAG indexing completed for resume ${resume._id}`
        );
      } catch (ragError) {
        console.error(
          "Resume RAG indexing error:",
          ragError
        );

        // Resume upload remains successful even if
        // RAG indexing fails.
      }
    } catch (extractionError) {
      console.error(
        "Resume extraction error:",
        extractionError
      );

      resume.extractionStatus = "failed";

      await resume.save();
    }

    return res.status(201).json({
      success: true,
      message: "Resume uploaded successfully",

      resume: {
        id: resume._id,
        originalName: resume.originalName,
        fileType: resume.fileType,
        fileSize: resume.fileSize,
        extractionStatus: resume.extractionStatus,
        isDefault: resume.isDefault,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Upload resume error:",
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
      message: "Server error while uploading resume",
    });
  }
};


const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({
      user: req.user.userId,
    })
      .select("-extractedText -filePath")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      resumes,
    });
  } catch (error) {
    console.error(
      "Get resumes error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error while fetching resumes",
    });
  }
};


const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user.userId,
    }).select("-filePath");

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    return res.status(200).json({
      success: true,
      resume,
    });
  } catch (error) {
    console.error(
      "Get resume error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error while fetching resume",
    });
  }
};


const setDefaultResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    // Remove default status from all resumes
    // belonging to this user.
    await Resume.updateMany(
      {
        user: req.user.userId,
        _id: { $ne: resume._id },
      },
      {
        $set: {
          isDefault: false,
        },
      }
    );

    // Make the selected resume the default.
    resume.isDefault = true;

    await resume.save();

    return res.status(200).json({
      success: true,
      message: "Default resume updated successfully",

      resume: {
        id: resume._id,
        originalName: resume.originalName,
        isDefault: resume.isDefault,
      },
    });
  } catch (error) {
    console.error(
      "Set default resume error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while setting default resume",
    });
  }
};


const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    if (
      resume.filePath &&
      fs.existsSync(resume.filePath)
    ) {
      fs.unlinkSync(resume.filePath);
    }

    const wasDefault = resume.isDefault;

    await resume.deleteOne();

    // If the deleted resume was the default,
    // automatically make the newest remaining
    // resume the default.
    if (wasDefault) {
      const nextResume = await Resume.findOne({
        user: req.user.userId,
      }).sort({
        createdAt: -1,
      });

      if (nextResume) {
        nextResume.isDefault = true;

        await nextResume.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete resume error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error while deleting resume",
    });
  }
};


module.exports = {
  uploadResume,
  getResumes,
  getResumeById,
  setDefaultResume,
  deleteResume,
};