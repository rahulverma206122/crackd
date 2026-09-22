const Resume = require("../models/Resume");
const JobDescription = require("../models/JobDescription");
const Interview = require("../models/Interview");

const {
  startInterview,
  evaluateInterviewAnswer,
  generateNextInterviewBatch,
  transcribeAudio,
} = require("../services/aiService");

// ============================================================
// HELPERS
// ============================================================

const normalizeInterviewType = (interviewType) => {
  const allowedTypes = [
    "technical",
    "behavioral",
    "project",
    "mixed",
  ];

  if (allowedTypes.includes(interviewType)) {
    return interviewType;
  }

  return "mixed";
};

const validateQuestionType = (
  questionType,
  interviewType
) => {
  if (interviewType === "technical") {
    return questionType === "technical";
  }

  if (interviewType === "behavioral") {
    return questionType === "behavioral";
  }

  if (interviewType === "project") {
    return questionType === "project";
  }

  return [
    "technical",
    "behavioral",
    "project",
    "general",
  ].includes(questionType);
};

// ============================================================
// START INTERVIEW
// ============================================================

const createInterview = async (req, res) => {
  try {
    const {
      resumeId,
      jobDescriptionId,
      interviewType,
    } = req.body;

    // ========================================================
    // VALIDATE RESUME
    // ========================================================

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: "resumeId is required",
      });
    }

    // ========================================================
    // INTERVIEW TYPE
    // ========================================================

    const selectedInterviewType =
      normalizeInterviewType(interviewType);

    // ========================================================
    // FIND RESUME
    // ========================================================

    const resume = await Resume.findOne({
      _id: resumeId,
      user: req.user.userId,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    if (
      resume.extractionStatus !== "completed" ||
      !resume.extractedText?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Resume text is not available",
      });
    }

    // ========================================================
    // FIND JOB DESCRIPTION
    // JD IS OPTIONAL
    // ========================================================

    let jobDescription = null;

    if (jobDescriptionId) {
      jobDescription = await JobDescription.findOne({
        _id: jobDescriptionId,
        user: req.user.userId,
      });

      if (!jobDescription) {
        return res.status(404).json({
          success: false,
          message: "Job description not found",
        });
      }

      if (
        !jobDescription.descriptionText?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Job description text is empty",
        });
      }
    }

    // ========================================================
    // GENERATE FIRST 10 QUESTIONS
    // ========================================================

    console.log(
      "Starting AI interview with first 10 questions..."
    );

    // RAG SOURCE IDS ADDED HERE
    const aiResult = await startInterview(
      resume.extractedText,
      jobDescription?.descriptionText || "",
      selectedInterviewType,
      resume._id.toString(),
      jobDescription?._id?.toString() || null
    );

    if (
      !aiResult?.questions ||
      !Array.isArray(aiResult.questions) ||
      aiResult.questions.length !== 10
    ) {
      return res.status(500).json({
        success: false,
        message:
          "AI service did not return exactly 10 questions",
      });
    }

    // ========================================================
    // VALIDATE AI QUESTIONS
    // ========================================================

    const questions = aiResult.questions.map(
      (question, index) => {
        const questionType =
          question.question_type;

        const allowedDifficulties = [
          "easy",
          "medium",
          "hard",
        ];

        const difficulty =
          allowedDifficulties.includes(
            question.difficulty
          )
            ? question.difficulty
            : "medium";

        if (
          !validateQuestionType(
            questionType,
            selectedInterviewType
          )
        ) {
          throw new Error(
            `AI returned an invalid question type for question ${
              index + 1
            }`
          );
        }

        return {
          question: question.question,

          answer: "",

          questionNumber: index + 1,

          roundNumber: 1,

          questionType,

          difficulty,

          evaluation: {
            score: null,
            answerMatchPercentage: null,
            correctAnswer: "",
            feedback: "",
            strengths: [],
            improvements: [],
          },

          answered: false,
        };
      }
    );

    // ========================================================
    // CREATE INTERVIEW
    // ========================================================

    const interview = await Interview.create({
      user: req.user.userId,

      resume: resume._id,

      jobDescription:
        jobDescription?._id || null,

      interviewType:
        selectedInterviewType,

      status: "active",

      currentRound: 1,

      completedRounds: 0,

      questions,

      overallScore: null,

      overallMatchPercentage: null,
    });

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({
      success: true,

      message:
        "Interview started with 10 questions",

      interview,
    });

  } catch (error) {
    console.error(
      "Create interview error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to start interview",
    });
  }
};

// ============================================================
// SUBMIT ANSWER
// ============================================================

const submitAnswer = async (req, res) => {
  try {
    const {
      interviewId,
      answer,
    } = req.body;

    if (
      !interviewId ||
      !answer?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "interviewId and answer are required",
      });
    }

    // ========================================================
    // FIND INTERVIEW
    // ========================================================

    const interview =
      await Interview.findOne({
        _id: interviewId,
        user: req.user.userId,
      });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (
      interview.status === "completed"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Interview is already completed",
      });
    }

    // ========================================================
    // FIND CURRENT UNANSWERED QUESTION
    // ========================================================

    const currentQuestion =
      interview.questions.find(
        (question) =>
          !question.answered &&
          question.roundNumber ===
            interview.currentRound
      );

    if (!currentQuestion) {
      return res.status(400).json({
        success: false,
        message:
          "No unanswered question found in the current round",
      });
    }

    // ========================================================
    // FIND RESUME
    // ========================================================

    const resume =
      await Resume.findOne({
        _id: interview.resume,
        user: req.user.userId,
      });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    if (
      resume.extractionStatus !== "completed" ||
      !resume.extractedText?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Resume text is not available",
      });
    }

    // ========================================================
    // FIND JOB DESCRIPTION
    // JD IS OPTIONAL
    // ========================================================

    let jobDescription = null;

    if (interview.jobDescription) {
      jobDescription =
        await JobDescription.findOne({
          _id: interview.jobDescription,
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
        !jobDescription.descriptionText?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Job description text is empty",
        });
      }
    }

    // ========================================================
    // PREVIOUS QUESTIONS
    // ========================================================

    const previousQuestions =
      interview.questions.map(
        (item) => item.question
      );

    // ========================================================
    // EVALUATE ANSWER
    // ========================================================

    console.log(
      `Evaluating Round ${currentQuestion.roundNumber}, Question ${currentQuestion.questionNumber}...`
    );

    // RAG SOURCE IDS ADDED HERE
    const aiResult =
      await evaluateInterviewAnswer(
        resume.extractedText,

        jobDescription?.descriptionText || "",

        interview.interviewType,

        currentQuestion.question,

        answer.trim(),

        previousQuestions,

        resume._id.toString(),

        jobDescription?._id?.toString() || null
      );

    if (
      !aiResult?.evaluation
    ) {
      return res.status(500).json({
        success: false,
        message:
          "AI service did not return an evaluation",
      });
    }

    const evaluation =
      aiResult.evaluation;

    // ========================================================
    // VALIDATE EVALUATION VALUES
    // ========================================================

    const score = Number(
      evaluation.score
    );

    const answerMatchPercentage =
      Number(
        evaluation.answer_match_percentage
      );

    if (
      Number.isNaN(score) ||
      score < 0 ||
      score > 10
    ) {
      return res.status(500).json({
        success: false,
        message:
          "AI returned an invalid score",
      });
    }

    if (
      Number.isNaN(
        answerMatchPercentage
      ) ||
      answerMatchPercentage < 0 ||
      answerMatchPercentage > 100
    ) {
      return res.status(500).json({
        success: false,
        message:
          "AI returned an invalid answer match percentage",
      });
    }

    // ========================================================
    // CORRECT ANSWER
    // ========================================================

    const correctAnswer =
      typeof evaluation.correct_answer === "string"
        ? evaluation.correct_answer.trim()
        : "";

    // ========================================================
    // SAVE ANSWER + EVALUATION
    // ========================================================

    currentQuestion.answer =
      answer.trim();

    currentQuestion.answered =
      true;

    currentQuestion.evaluation = {
      score,

      answerMatchPercentage,

      correctAnswer,

      feedback:
        evaluation.feedback || "",

      strengths:
        Array.isArray(
          evaluation.strengths
        )
          ? evaluation.strengths
          : [],

      improvements:
        Array.isArray(
          evaluation.improvements
        )
          ? evaluation.improvements
          : [],
    };

    // ========================================================
    // CHECK CURRENT ROUND
    // ========================================================

    const currentRoundQuestions =
      interview.questions.filter(
        (question) =>
          question.roundNumber ===
          interview.currentRound
      );

    const roundCompleted =
      currentRoundQuestions.length === 10 &&
      currentRoundQuestions.every(
        (question) =>
          question.answered === true
      );

    // ========================================================
    // CALCULATE ROUND SCORE
    // ========================================================

    let roundAverageScore = null;
    let roundAverageMatch = null;

    if (roundCompleted) {
      const answeredQuestions =
        currentRoundQuestions.filter(
          (question) =>
            question.evaluation?.score !==
              null &&
            question.evaluation
              ?.answerMatchPercentage !==
              null
        );

      if (answeredQuestions.length) {
        const totalScore =
          answeredQuestions.reduce(
            (sum, question) =>
              sum +
              question.evaluation.score,
            0
          );

        const totalMatch =
          answeredQuestions.reduce(
            (sum, question) =>
              sum +
              question.evaluation
                .answerMatchPercentage,
            0
          );

        roundAverageScore =
          totalScore /
          answeredQuestions.length;

        roundAverageMatch =
          totalMatch /
          answeredQuestions.length;
      }

      interview.completedRounds += 1;
    }

    // ========================================================
    // CALCULATE OVERALL PERFORMANCE
    // ========================================================

    const allAnsweredQuestions =
      interview.questions.filter(
        (question) =>
          question.answered &&
          question.evaluation?.score !==
            null &&
          question.evaluation
            ?.answerMatchPercentage !==
            null
      );

    if (allAnsweredQuestions.length) {
      const totalScore =
        allAnsweredQuestions.reduce(
          (sum, question) =>
            sum +
            question.evaluation.score,
          0
        );

      const totalMatch =
        allAnsweredQuestions.reduce(
          (sum, question) =>
            sum +
            question.evaluation
              .answerMatchPercentage,
          0
        );

      interview.overallScore =
        Number(
          (
            totalScore /
            allAnsweredQuestions.length
          ).toFixed(2)
        );

      interview.overallMatchPercentage =
        Number(
          (
            totalMatch /
            allAnsweredQuestions.length
          ).toFixed(2)
        );
    }

    // ========================================================
    // SAVE
    // ========================================================

    await interview.save();

    // ========================================================
    // CONVERT PYTHON SNAKE_CASE RESPONSE
    // TO FRONTEND CAMELCASE RESPONSE
    // ========================================================

    const frontendEvaluation = {
      score,

      answerMatchPercentage,

      correctAnswer,

      feedback:
        evaluation.feedback || "",

      strengths:
        Array.isArray(
          evaluation.strengths
        )
          ? evaluation.strengths
          : [],

      improvements:
        Array.isArray(
          evaluation.improvements
        )
          ? evaluation.improvements
          : [],
    };

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      message: roundCompleted
        ? "Answer evaluated. Round completed."
        : "Answer evaluated",

      evaluation:
        frontendEvaluation,

      roundCompleted,

      roundNumber:
        currentQuestion.roundNumber,

      questionNumber:
        currentQuestion.questionNumber,

      roundAverageScore,

      roundAverageMatch,

      overallScore:
        interview.overallScore,

      overallMatchPercentage:
        interview.overallMatchPercentage,

      interview,
    });

  } catch (error) {
    console.error(
      "Submit interview answer error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to evaluate answer",
    });
  }
};

// ============================================================
// START NEXT 10 QUESTIONS
// ============================================================

const createNextInterviewBatch =
  async (req, res) => {
    try {
      const {
        interviewId,
      } = req.body;

      if (!interviewId) {
        return res.status(400).json({
          success: false,
          message:
            "interviewId is required",
        });
      }

      // ======================================================
      // FIND INTERVIEW
      // ======================================================

      const interview =
        await Interview.findOne({
          _id: interviewId,
          user: req.user.userId,
        });

      if (!interview) {
        return res.status(404).json({
          success: false,
          message:
            "Interview not found",
        });
      }

      if (
        interview.status ===
        "completed"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Interview is already completed",
        });
      }

      // ======================================================
      // CHECK CURRENT ROUND
      // ======================================================

      const currentRoundQuestions =
        interview.questions.filter(
          (question) =>
            question.roundNumber ===
            interview.currentRound
        );

      if (
        currentRoundQuestions.length !==
        10
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Current round does not contain exactly 10 questions",
        });
      }

      const allCurrentRoundAnswered =
        currentRoundQuestions.every(
          (question) =>
            question.answered === true
        );

      if (!allCurrentRoundAnswered) {
        return res.status(400).json({
          success: false,
          message:
            "Complete all 10 questions before starting the next round",
        });
      }

      // ======================================================
      // FIND RESUME
      // ======================================================

      const resume =
        await Resume.findOne({
          _id: interview.resume,
          user: req.user.userId,
        });

      if (!resume) {
        return res.status(404).json({
          success: false,
          message: "Resume not found",
        });
      }

      if (
        resume.extractionStatus !==
          "completed" ||
        !resume.extractedText?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Resume text is not available",
        });
      }

      // ======================================================
      // FIND JOB DESCRIPTION
      // ======================================================

      let jobDescription = null;

      if (interview.jobDescription) {
        jobDescription =
          await JobDescription.findOne({
            _id:
              interview.jobDescription,
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
          !jobDescription.descriptionText?.trim()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Job description text is empty",
          });
        }
      }

      // ======================================================
      // PREVIOUS QUESTIONS
      // ======================================================

      const previousQuestions =
        interview.questions.map(
          (question) =>
            question.question
        );

      // ======================================================
      // PREVIOUS PERFORMANCE
      // ADAPTIVE DIFFICULTY
      // ======================================================

      const previousPerformance =
        interview.questions
          .filter(
            (question) =>
              question.answered === true &&
              question.evaluation &&
              question.evaluation.score !== null &&
              question.evaluation.answerMatchPercentage !==
                null
          )
          .slice(-10)
          .map((question) => ({
            question:
              question.question,

            question_type:
              question.questionType,

            difficulty:
              question.difficulty ||
              "medium",

            score:
              question.evaluation.score,

            answer_match_percentage:
              question.evaluation
                .answerMatchPercentage,
          }));

      // ======================================================
      // NEXT ROUND NUMBER
      // ======================================================

      const nextRound =
        interview.currentRound + 1;

      // ======================================================
      // GENERATE NEXT 10 QUESTIONS
      // ======================================================

      console.log(
        `Generating interview Round ${nextRound}...`
      );

      // RAG SOURCE IDS ADDED HERE
      const aiResult =
        await generateNextInterviewBatch(
          resume.extractedText,

          jobDescription?.descriptionText ||
            "",

          interview.interviewType,

          previousQuestions,

          previousPerformance,

          resume._id.toString(),

          jobDescription?._id?.toString() || null
        );

      if (
        !aiResult?.questions ||
        !Array.isArray(
          aiResult.questions
        ) ||
        aiResult.questions.length !== 10
      ) {
        return res.status(500).json({
          success: false,
          message:
            "AI service did not return exactly 10 new questions",
        });
      }

      // ======================================================
      // VALIDATE NEXT QUESTIONS
      // ======================================================

      const nextQuestions =
        aiResult.questions.map(
          (question, index) => {
            const questionType =
              question.question_type;

            const allowedDifficulties = [
              "easy",
              "medium",
              "hard",
            ];

            const difficulty =
              allowedDifficulties.includes(
                question.difficulty
              )
                ? question.difficulty
                : "medium";

            if (
              !validateQuestionType(
                questionType,
                interview.interviewType
              )
            ) {
              throw new Error(
                `AI returned an invalid question type for question ${
                  index + 1
                }`
              );
            }

            return {
              question:
                question.question,

              answer: "",

              questionNumber:
                index + 1,

              roundNumber:
                nextRound,

              questionType,

              difficulty,

              evaluation: {
                score: null,

                answerMatchPercentage:
                  null,

                correctAnswer: "",

                feedback: "",

                strengths: [],

                improvements: [],
              },

              answered: false,
            };
          }
        );

      // ======================================================
      // UPDATE INTERVIEW
      // ======================================================

      interview.currentRound =
        nextRound;

      interview.questions.push(
        ...nextQuestions
      );

      await interview.save();

      // ======================================================
      // RESPONSE
      // ======================================================

      return res.status(200).json({
        success: true,

        message:
          `Round ${nextRound} started with 10 new questions`,

        roundNumber:
          nextRound,

        questions:
          nextQuestions,

        interview,
      });

    } catch (error) {
      console.error(
        "Create next interview batch error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to generate next interview batch",
      });
    }
  };
  // ============================================================
// GET INTERVIEW HISTORY
// ============================================================

const getInterviewHistory = async (req, res) => {
  try {
    const interviews = await Interview.find({
      user: req.user.userId,
    })
      .populate("resume", "originalName")
      .populate(
        "jobDescription",
        "title company role"
      )
      .select(
        "resume jobDescription interviewType status currentRound completedRounds overallScore overallMatchPercentage createdAt updatedAt"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: interviews.length,
      interviews,
    });

  } catch (error) {
    console.error(
      "Get interview history error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch interview history",
    });
  }
};

// ============================================================
// GET SINGLE INTERVIEW DETAILS
// ============================================================

const getInterviewDetails = async (req, res) => {
  try {
    const { interviewId } = req.params;

    if (!interviewId) {
      return res.status(400).json({
        success: false,
        message: "interviewId is required",
      });
    }

    const interview = await Interview.findOne({
      _id: interviewId,
      user: req.user.userId,
    })
      .populate(
        "resume",
        "originalName fileName"
      )
      .populate(
        "jobDescription",
        "title company role descriptionText"
      );

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    return res.status(200).json({
      success: true,
      interview,
    });

  } catch (error) {
    console.error(
      "Get interview details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch interview details",
    });
  }
};

// ============================================================
// GET INTERVIEW PERFORMANCE ANALYTICS
// ============================================================

const getInterviewAnalytics = async (req, res) => {
  try {
    // ========================================================
    // FIND ALL USER INTERVIEWS
    // ========================================================

    const interviews = await Interview.find({
      user: req.user.userId,
    }).sort({ createdAt: 1 });

    // ========================================================
    // NO INTERVIEWS
    // ========================================================

    if (!interviews.length) {
      return res.status(200).json({
        success: true,
        analytics: {
          totalInterviews: 0,
          totalQuestions: 0,
          answeredQuestions: 0,
          overallScore: 0,
          overallMatchPercentage: 0,
          categoryPerformance: [],
          difficultyPerformance: [],
          interviewTrend: [],
          strengths: [],
          improvementAreas: [],
        },
      });
    }

    // ========================================================
    // COLLECT ANSWERED QUESTIONS
    // ========================================================

    const allQuestions = [];

    interviews.forEach((interview) => {
      interview.questions.forEach((question) => {
        if (
          question.answered === true &&
          question.evaluation &&
          question.evaluation.score !== null &&
          question.evaluation.answerMatchPercentage !== null
        ) {
          allQuestions.push({
            interviewId: interview._id,
            createdAt: interview.createdAt,
            question: question.question,
            questionType:
              question.questionType || "general",
            difficulty:
              question.difficulty || "medium",
            score: Number(
              question.evaluation.score
            ),
            answerMatchPercentage: Number(
              question.evaluation
                .answerMatchPercentage
            ),
            strengths: Array.isArray(
              question.evaluation.strengths
            )
              ? question.evaluation.strengths
              : [],
            improvements: Array.isArray(
              question.evaluation.improvements
            )
              ? question.evaluation.improvements
              : [],
          });
        }
      });
    });

    // ========================================================
    // BASIC METRICS
    // ========================================================

    const totalInterviews =
      interviews.length;

    const totalQuestions =
      interviews.reduce(
        (total, interview) =>
          total +
          interview.questions.length,
        0
      );

    const answeredQuestions =
      allQuestions.length;

    // ========================================================
    // OVERALL PERFORMANCE
    // ========================================================

    let overallScore = 0;
    let overallMatchPercentage = 0;

    if (answeredQuestions > 0) {
      const totalScore =
        allQuestions.reduce(
          (sum, question) =>
            sum + question.score,
          0
        );

      const totalMatch =
        allQuestions.reduce(
          (sum, question) =>
            sum +
            question.answerMatchPercentage,
          0
        );

      overallScore = Number(
        (
          totalScore /
          answeredQuestions
        ).toFixed(2)
      );

      overallMatchPercentage =
        Number(
          (
            totalMatch /
            answeredQuestions
          ).toFixed(2)
        );
    }

    // ========================================================
    // CATEGORY PERFORMANCE
    // ========================================================

    const categoryMap = {};

    allQuestions.forEach((question) => {
      const category =
        question.questionType;

      if (!categoryMap[category]) {
        categoryMap[category] = {
          category,
          totalQuestions: 0,
          totalScore: 0,
          totalMatch: 0,
        };
      }

      categoryMap[category]
        .totalQuestions += 1;

      categoryMap[category]
        .totalScore +=
        question.score;

      categoryMap[category]
        .totalMatch +=
        question.answerMatchPercentage;
    });

    const categoryPerformance =
      Object.values(
        categoryMap
      ).map((item) => ({
        category: item.category,

        totalQuestions:
          item.totalQuestions,

        averageScore: Number(
          (
            item.totalScore /
            item.totalQuestions
          ).toFixed(2)
        ),

        averageMatchPercentage:
          Number(
            (
              item.totalMatch /
              item.totalQuestions
            ).toFixed(2)
          ),
      }));

    // ========================================================
    // DIFFICULTY PERFORMANCE
    // ========================================================

    const difficultyMap = {};

    allQuestions.forEach((question) => {
      const difficulty =
        question.difficulty;

      if (!difficultyMap[difficulty]) {
        difficultyMap[difficulty] = {
          difficulty,
          totalQuestions: 0,
          totalScore: 0,
          totalMatch: 0,
        };
      }

      difficultyMap[difficulty]
        .totalQuestions += 1;

      difficultyMap[difficulty]
        .totalScore +=
        question.score;

      difficultyMap[difficulty]
        .totalMatch +=
        question.answerMatchPercentage;
    });

    const difficultyOrder = [
      "easy",
      "medium",
      "hard",
    ];

    const difficultyPerformance =
      difficultyOrder
        .filter(
          (difficulty) =>
            difficultyMap[difficulty]
        )
        .map((difficulty) => {
          const item =
            difficultyMap[difficulty];

          return {
            difficulty,

            totalQuestions:
              item.totalQuestions,

            averageScore: Number(
              (
                item.totalScore /
                item.totalQuestions
              ).toFixed(2)
            ),

            averageMatchPercentage:
              Number(
                (
                  item.totalMatch /
                  item.totalQuestions
                ).toFixed(2)
              ),
          };
        });

    // ========================================================
    // INTERVIEW TREND
    // ========================================================

    const interviewTrend =
      interviews.map(
        (interview, index) => {
          const answered =
            interview.questions.filter(
              (question) =>
                question.answered === true &&
                question.evaluation &&
                question.evaluation.score !==
                  null &&
                question.evaluation
                  .answerMatchPercentage !==
                  null
            );

          if (!answered.length) {
            return {
              interviewNumber:
                index + 1,

              interviewId:
                interview._id,

              interviewType:
                interview.interviewType,

              date:
                interview.createdAt,

              averageScore: 0,

              averageMatchPercentage: 0,

              answeredQuestions: 0,
            };
          }

          const totalScore =
            answered.reduce(
              (sum, question) =>
                sum +
                Number(
                  question.evaluation
                    .score
                ),
              0
            );

          const totalMatch =
            answered.reduce(
              (sum, question) =>
                sum +
                Number(
                  question.evaluation
                    .answerMatchPercentage
                ),
              0
            );

          return {
            interviewNumber:
              index + 1,

            interviewId:
              interview._id,

            interviewType:
              interview.interviewType,

            date:
              interview.createdAt,

            averageScore: Number(
              (
                totalScore /
                answered.length
              ).toFixed(2)
            ),

            averageMatchPercentage:
              Number(
                (
                  totalMatch /
                  answered.length
                ).toFixed(2)
              ),

            answeredQuestions:
              answered.length,
          };
        }
      );

    // ========================================================
    // STRENGTHS
    // ========================================================

    const strengthMap = {};

    allQuestions.forEach((question) => {
      question.strengths.forEach(
        (strength) => {
          if (
            !strength ||
            typeof strength !== "string"
          ) {
            return;
          }

          const cleaned =
            strength.trim();

          if (!cleaned) {
            return;
          }

          const key =
            cleaned.toLowerCase();

          if (!strengthMap[key]) {
            strengthMap[key] = {
              text: cleaned,
              count: 0,
            };
          }

          strengthMap[key].count += 1;
        }
      );
    });

    const strengths =
      Object.values(strengthMap)
        .sort(
          (a, b) =>
            b.count - a.count
        )
        .slice(0, 5)
        .map((item) => ({
          text: item.text,
          occurrences: item.count,
        }));

    // ========================================================
    // IMPROVEMENT AREAS
    // ========================================================

    const improvementMap = {};

    allQuestions.forEach((question) => {
      question.improvements.forEach(
        (improvement) => {
          if (
            !improvement ||
            typeof improvement !== "string"
          ) {
            return;
          }

          const cleaned =
            improvement.trim();

          if (!cleaned) {
            return;
          }

          const key =
            cleaned.toLowerCase();

          if (!improvementMap[key]) {
            improvementMap[key] = {
              text: cleaned,
              count: 0,
            };
          }

          improvementMap[key].count += 1;
        }
      );
    });

    const improvementAreas =
      Object.values(
        improvementMap
      )
        .sort(
          (a, b) =>
            b.count - a.count
        )
        .slice(0, 5)
        .map((item) => ({
          text: item.text,
          occurrences: item.count,
        }));

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      analytics: {
        totalInterviews,

        totalQuestions,

        answeredQuestions,

        overallScore,

        overallMatchPercentage,

        categoryPerformance,

        difficultyPerformance,

        interviewTrend,

        strengths,

        improvementAreas,
      },
    });

  } catch (error) {
    console.error(
      "Get interview analytics error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch interview analytics",
    });
  }
};

// ============================================================
// TRANSCRIBE INTERVIEW AUDIO
// ============================================================

const transcribeInterviewAudio = async (
  req,
  res
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio file is required",
      });
    }

    const result = await transcribeAudio(
      req.file.buffer,
      req.file.mimetype || "audio/webm",
      req.file.originalname ||
        "interview-answer.webm"
    );

    return res.status(200).json({
      success: true,
      text: result?.text || "",
    });

  } catch (error) {
    console.error(
      "Interview audio transcription error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to transcribe interview audio",
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createInterview,
  submitAnswer,
  createNextInterviewBatch,
  getInterviewHistory,
  getInterviewDetails,
  getInterviewAnalytics,
  transcribeInterviewAudio,
};