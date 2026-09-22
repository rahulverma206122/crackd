const mongoose = require("mongoose");


// ============================================================
// INTERVIEW QUESTION
// ============================================================

const InterviewQuestionSchema = new mongoose.Schema(
  {
    // The actual interview question
    question: {
      type: String,
      required: true,
      trim: true,
    },

    // Candidate's answer
    answer: {
      type: String,
      default: "",
    },

    // Question number inside the current round
    // Example: 1, 2, 3 ... 10
    questionNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    // Round number
    // Example:
    // Round 1 -> questions 1-10
    // Round 2 -> questions 1-10
    roundNumber: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    // Question category
    questionType: {
      type: String,
      enum: [
        "technical",
        "behavioral",
        "project",
        "general",
      ],
      default: "technical",
    },

    // ========================================================
    // ADAPTIVE INTERVIEW DIFFICULTY
    // ========================================================
    // Difficulty is determined by the AI based on the
    // candidate's previous interview performance.
    difficulty: {
      type: String,
      enum: [
        "easy",
        "medium",
        "hard",
      ],
      default: "medium",
    },

    // Answer evaluation
    evaluation: {
      // Score from 0 to 10
      score: {
        type: Number,
        min: 0,
        max: 10,
        default: null,
      },

      // Conceptual similarity/correctness percentage
      // NOT literal text similarity
      answerMatchPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      // AI-generated model/correct answer
      correctAnswer: {
        type: String,
        default: "",
      },

      // AI feedback
      feedback: {
        type: String,
        default: "",
      },

      // Things candidate did well
      strengths: {
        type: [String],
        default: [],
      },

      // Things candidate should improve
      improvements: {
        type: [String],
        default: [],
      },
    },

    // Whether candidate has answered this question
    answered: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);


// ============================================================
// INTERVIEW
// ============================================================

const InterviewSchema = new mongoose.Schema(
  {
    // Candidate/user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Resume used for the interview
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },

    // Job description is optional
    // Interview can work using only the resume
    jobDescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobDescription",
      default: null,
    },

    // Selected interview mode
    interviewType: {
      type: String,
      enum: [
        "technical",
        "behavioral",
        "project",
        "mixed",
      ],
      default: "mixed",
    },

    // Current interview status
    status: {
      type: String,
      enum: [
        "active",
        "completed",
      ],
      default: "active",
    },

    // Current round number
    // Starts at 1 and increments when
    // user starts the next 10 questions
    currentRound: {
      type: Number,
      min: 1,
      default: 1,
    },

    // Number of completed rounds
    completedRounds: {
      type: Number,
      min: 0,
      default: 0,
    },

    // All questions from all rounds
    questions: {
      type: [InterviewQuestionSchema],
      default: [],
    },

    // Overall interview score
    overallScore: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },

    // Overall conceptual answer match percentage
    overallMatchPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


// ============================================================
// EXPORT
// ============================================================

module.exports = mongoose.model(
  "Interview",
  InterviewSchema
);