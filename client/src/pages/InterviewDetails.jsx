import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getInterviewDetails,
} from "../services/api";

import { useAuth } from "../context/AuthContext";


// ============================================================
// HELPERS
// ============================================================

const formatDate = (date) => {
  if (!date) return "Unknown date";

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
};


const formatDateTime = (date) => {
  if (!date) return "Unknown date";

  return new Date(date).toLocaleString(
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


const formatInterviewType = (type) => {
  if (!type) return "Mixed";

  return (
    type.charAt(0).toUpperCase() +
    type.slice(1)
  );
};


const formatQuestionType = (type) => {
  if (!type) return "General";

  return (
    type.charAt(0).toUpperCase() +
    type.slice(1)
  );
};


// ============================================================
// INTERVIEW DETAILS
// ============================================================

const InterviewDetails = () => {
  const { interviewId } = useParams();

  const { token } = useAuth();

  const [interview, setInterview] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================================
  // FETCH INTERVIEW
  // ==========================================================

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getInterviewDetails(
            interviewId,
            token
          );

        setInterview(
          data.interview
        );
      } catch (error) {
        console.error(
          "Interview details error:",
          error
        );

        setError(
          error.message ||
            "Failed to load interview details"
        );
      } finally {
        setLoading(false);
      }
    };


    if (
      token &&
      interviewId
    ) {
      fetchInterview();
    }
  }, [
    token,
    interviewId,
  ]);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 px-6 py-10">

        <div className="mx-auto max-w-6xl">

          <div className="mb-8">

            <div className="h-4 w-28 animate-pulse rounded bg-orange-100" />

            <div className="mt-4 h-9 w-72 animate-pulse rounded-lg bg-orange-100" />

            <div className="mt-3 h-4 w-96 animate-pulse rounded bg-orange-100" />

          </div>


          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-2xl border border-orange-100 bg-white"
                />
              )
            )}

          </div>


          <div className="mt-6 space-y-4">

            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-52 animate-pulse rounded-2xl border border-orange-100 bg-white"
                />
              )
            )}

          </div>

        </div>

      </div>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="min-h-screen bg-orange-50 px-6 py-10">

        <div className="mx-auto max-w-6xl">

          <Link
            to="/interview-history"
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            ← Back to Interview History
          </Link>


          <div className="mt-6 rounded-2xl border border-red-200 bg-white p-6">

            <h1 className="text-xl font-semibold text-gray-900">
              Unable to load interview
            </h1>

            <p className="mt-3 text-sm text-red-600">
              {error}
            </p>


            <Link
              to="/interview-history"
              className="mt-5 inline-flex rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              Back to History
            </Link>

          </div>

        </div>

      </div>
    );
  }


  // ==========================================================
  // INTERVIEW NOT FOUND
  // ==========================================================

  if (!interview) {
    return (
      <div className="min-h-screen bg-orange-50 px-6 py-10">

        <div className="mx-auto max-w-6xl">

          <Link
            to="/interview-history"
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            ← Back to Interview History
          </Link>


          <div className="mt-6 rounded-2xl border border-orange-100 bg-white p-10 text-center">

            <h1 className="text-xl font-semibold text-gray-900">
              Interview not found
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              This interview may have been deleted
              or is no longer available.
            </p>

          </div>

        </div>

      </div>
    );
  }


  // ==========================================================
  // CALCULATE QUESTION STATS
  // ==========================================================

  const questions =
    interview.questions || [];

  const answeredQuestions =
    questions.filter(
      (question) =>
        question.answered === true
    );

  const totalQuestions =
    questions.length;

  const answeredCount =
    answeredQuestions.length;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-orange-50 px-6 py-10">

      <div className="mx-auto max-w-6xl">

        {/* ================================================== */}
        {/* BACK */}
        {/* ================================================== */}

        <Link
          to="/interview-history"
          className="inline-flex items-center text-sm font-medium text-orange-600 transition hover:text-orange-700"
        >
          ← Back to Interview History
        </Link>


        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <div className="flex flex-wrap items-center gap-2">

              <h1 className="text-3xl font-bold text-gray-900">
                {formatInterviewType(
                  interview.interviewType
                )}{" "}
                Interview
              </h1>


              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  interview.status ===
                  "completed"
                    ? "bg-green-50 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {interview.status ===
                "completed"
                  ? "Completed"
                  : "Active"}
              </span>

            </div>


            <p className="mt-2 text-sm text-gray-500">
              Started on{" "}
              {formatDateTime(
                interview.createdAt
              )}
            </p>

          </div>


          <Link
            to="/interview"
            className="inline-flex w-fit rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Start New Interview
          </Link>

        </div>


        {/* ================================================== */}
        {/* INTERVIEW INFORMATION */}
        {/* ================================================== */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* SCORE */}

          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">

            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Overall Score
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">

              {interview.overallScore !==
                null &&
              interview.overallScore !==
                undefined
                ? `${interview.overallScore}/10`
                : "—"}

            </p>

          </div>


          {/* MATCH */}

          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">

            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Answer Match
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">

              {interview
                .overallMatchPercentage !==
                null &&
              interview
                .overallMatchPercentage !==
                undefined
                ? `${interview.overallMatchPercentage}%`
                : "—"}

            </p>

          </div>


          {/* ROUNDS */}

          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">

            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Rounds
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {interview.completedRounds ||
                0}
            </p>

          </div>


          {/* QUESTIONS */}

          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">

            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Questions
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">

              {answeredCount}/
              {totalQuestions}

            </p>

          </div>

        </div>


        {/* ================================================== */}
        {/* RESUME / JOB DESCRIPTION */}
        {/* ================================================== */}

        <div className="mt-6 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">

          <div className="grid gap-5 md:grid-cols-2">

            {/* RESUME */}

            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Resume
              </p>

              <p className="mt-2 font-medium text-gray-900">
                {interview.resume
                  ?.originalName ||
                  "Resume"}
              </p>

            </div>


            {/* JOB DESCRIPTION */}

            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Job Description
              </p>

              {interview.jobDescription ? (
                <div className="mt-2">

                  <p className="font-medium text-gray-900">
                    {
                      interview
                        .jobDescription
                        .title
                    }
                  </p>

                  <p className="mt-1 text-sm text-gray-500">

                    {
                      interview
                        .jobDescription
                        .company
                    }

                    {interview
                      .jobDescription
                      .role && (
                      <>
                        {" "}
                        •{" "}
                        {
                          interview
                            .jobDescription
                            .role
                        }
                      </>
                    )}

                  </p>

                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  No job description used
                </p>
              )}

            </div>

          </div>

        </div>


        {/* ================================================== */}
        {/* QUESTIONS */}
        {/* ================================================== */}

        <div className="mt-8">

          <div className="mb-5">

            <h2 className="text-2xl font-bold text-gray-900">
              Interview Questions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Review your answers and AI evaluations.
            </p>

          </div>


          <div className="space-y-5">

            {questions.map(
              (question, index) => {

                const evaluation =
                  question.evaluation ||
                  {};

                return (
                  <div
                    key={
                      question._id ||
                      `${question.roundNumber}-${question.questionNumber}-${index}`
                    }
                    className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm"
                  >

                    {/* ==================================== */}
                    {/* QUESTION HEADER */}
                    {/* ==================================== */}

                    <div className="border-b border-gray-100 bg-orange-50 px-5 py-4">

                      <div className="flex flex-wrap items-center justify-between gap-3">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="rounded-lg bg-orange-500 px-2.5 py-1 text-xs font-semibold text-white">
                            Q{
                              question.questionNumber
                            }
                          </span>


                          <span className="text-sm font-medium text-gray-700">
                            Round{" "}
                            {
                              question.roundNumber
                            }
                          </span>


                          <span className="rounded-full border border-orange-200 bg-white px-2.5 py-1 text-xs font-medium text-orange-600">
                            {formatQuestionType(
                              question.questionType
                            )}
                          </span>

                        </div>


                        <span
                          className={`text-xs font-medium ${
                            question.answered
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {question.answered
                            ? "Answered"
                            : "Not answered"}
                        </span>

                      </div>


                      <h3 className="mt-4 text-base font-semibold leading-6 text-gray-900">
                        {question.question}
                      </h3>

                    </div>


                    {/* ==================================== */}
                    {/* ANSWER */}
                    {/* ==================================== */}

                    <div className="p-5">

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Your Answer
                        </p>


                        <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">

                          {question.answer?.trim() ? (
                            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                              {
                                question.answer
                              }
                            </p>
                          ) : (
                            <p className="text-sm italic text-gray-400">
                              No answer submitted.
                            </p>
                          )}

                        </div>

                      </div>


                      {/* ================================== */}
                      {/* EVALUATION */}
                      {/* ================================== */}

                      {question.answered &&
                        question.evaluation && (
                        <div className="mt-5">

                          <div className="grid gap-3 sm:grid-cols-2">

                            {/* SCORE */}

                            <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">

                              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Score
                              </p>

                              <p className="mt-1 text-2xl font-bold text-gray-900">

                                {evaluation.score !==
                                  null &&
                                evaluation.score !==
                                  undefined
                                  ? `${evaluation.score}/10`
                                  : "—"}

                              </p>

                            </div>


                            {/* MATCH */}

                            <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">

                              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Answer Match
                              </p>

                              <p className="mt-1 text-2xl font-bold text-gray-900">

                                {evaluation
                                  .answerMatchPercentage !==
                                  null &&
                                evaluation
                                  .answerMatchPercentage !==
                                  undefined
                                  ? `${evaluation.answerMatchPercentage}%`
                                  : "—"}

                              </p>

                            </div>

                          </div>


                          {/* ================================= */}
                          {/* CORRECT ANSWER */}
                          {/* ================================= */}

                          <div className="mt-4">

                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Correct Answer
                            </p>


                            <div className="mt-2 rounded-xl border border-green-100 bg-green-50 p-4">

                              {evaluation
                                .correctAnswer
                                ?.trim() ? (
                                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                  {
                                    evaluation.correctAnswer
                                  }
                                </p>
                              ) : (
                                <p className="text-sm italic text-gray-400">
                                  Correct answer is not available.
                                </p>
                              )}

                            </div>

                          </div>

                        </div>
                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>


        {/* ================================================== */}
        {/* FOOTER */}
        {/* ================================================== */}

        <div className="mt-8 flex flex-wrap gap-3">

          <Link
            to="/interview-history"
            className="rounded-lg border border-orange-200 bg-white px-5 py-2.5 text-sm font-medium text-orange-600 transition hover:bg-orange-50"
          >
            ← Interview History
          </Link>


          <Link
            to="/interview"
            className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Start New Interview
          </Link>

        </div>

      </div>

    </div>
  );
};


export default InterviewDetails;