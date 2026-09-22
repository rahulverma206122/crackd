import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getInterviewHistory,
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
      month: "short",
      year: "numeric",
    }
  );
};


const formatInterviewType = (type) => {
  if (!type) return "Mixed";

  return type
    .charAt(0)
    .toUpperCase() +
    type.slice(1);
};


// ============================================================
// INTERVIEW HISTORY PAGE
// ============================================================

const InterviewHistory = () => {
  const { token } = useAuth();

  const [interviews, setInterviews] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================================
  // FETCH INTERVIEW HISTORY
  // ==========================================================

  useEffect(() => {
    const fetchInterviewHistory =
      async () => {
        try {
          setLoading(true);
          setError("");

          const data =
            await getInterviewHistory(
              token
            );

          setInterviews(
            data.interviews || []
          );
        } catch (error) {
          console.error(
            "Interview history error:",
            error
          );

          setError(
            error.message ||
              "Failed to load interview history"
          );
        } finally {
          setLoading(false);
        }
      };


    if (token) {
      fetchInterviewHistory();
    }
  }, [token]);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">

          <div className="mb-8">
            <div className="h-8 w-56 animate-pulse rounded-lg bg-orange-100" />

            <div className="mt-3 h-4 w-80 animate-pulse rounded bg-orange-100" />
          </div>


          <div className="space-y-4">

            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-40 animate-pulse rounded-2xl border border-orange-100 bg-white"
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

          <div className="rounded-2xl border border-red-200 bg-white p-6">

            <h1 className="text-xl font-semibold text-gray-900">
              Interview History
            </h1>

            <p className="mt-3 text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
              className="mt-5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
            >
              Try Again
            </button>

          </div>

        </div>

      </div>
    );
  }


  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (interviews.length === 0) {
    return (
      <div className="min-h-screen bg-orange-50 px-6 py-10">

        <div className="mx-auto max-w-6xl">

          <div className="mb-8">

            <h1 className="text-3xl font-bold text-gray-900">
              Interview History
            </h1>

            <p className="mt-2 text-gray-600">
              Review your previous AI interview sessions
              and track your performance.
            </p>

          </div>


          <div className="rounded-2xl border border-orange-100 bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">

              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
                />
              </svg>

            </div>


            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              No interviews yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Once you complete an AI interview,
              your interview sessions will appear
              here.
            </p>


            <Link
              to="/interview"
              className="mt-6 inline-flex rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Start an Interview
            </Link>

          </div>

        </div>

      </div>
    );
  }


  // ==========================================================
  // HISTORY LIST
  // ==========================================================

  return (
    <div className="min-h-screen bg-orange-50 px-6 py-10">

      <div className="mx-auto max-w-6xl">

        {/* ================================================== */}
        {/* PAGE HEADER */}
        {/* ================================================== */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <h1 className="text-3xl font-bold text-gray-900">
              Interview History
            </h1>

            <p className="mt-2 text-gray-600">
              Review your previous AI interview sessions
              and performance.
            </p>

          </div>


          <Link
            to="/interview"
            className="inline-flex w-fit items-center rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            + New Interview
          </Link>

        </div>


        {/* ================================================== */}
        {/* INTERVIEW COUNT */}
        {/* ================================================== */}

        <div className="mb-5">

          <p className="text-sm text-gray-500">
            {interviews.length}{" "}
            {interviews.length === 1
              ? "interview"
              : "interviews"}{" "}
            found
          </p>

        </div>


        {/* ================================================== */}
        {/* INTERVIEW CARDS */}
        {/* ================================================== */}

        <div className="space-y-4">

          {interviews.map(
            (interview) => {

              const score =
                interview.overallScore;

              const match =
                interview.overallMatchPercentage;


              return (
                <div
                  key={interview._id}
                  className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md"
                >

                  {/* ======================================== */}
                  {/* TOP SECTION */}
                  {/* ======================================== */}

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <h2 className="text-lg font-semibold text-gray-900">
                          {formatInterviewType(
                            interview.interviewType
                          )}{" "}
                          Interview
                        </h2>


                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            interview.status ===
                            "completed"
                              ? "bg-green-50 text-green-700"
                              : "bg-orange-50 text-orange-700"
                          }`}
                        >
                          {interview.status ===
                          "completed"
                            ? "Completed"
                            : "Active"}
                        </span>

                      </div>


                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">

                        <span>
                          {formatDate(
                            interview.createdAt
                          )}
                        </span>


                        <span>
                          Round{" "}
                          {interview.currentRound ||
                            1}
                        </span>


                        {interview.resume
                          ?.originalName && (
                          <span className="max-w-xs truncate">
                            Resume:{" "}
                            {
                              interview
                                .resume
                                .originalName
                            }
                          </span>
                        )}

                      </div>


                      {/* COMPANY / ROLE */}

                      {interview.jobDescription && (
                        <p className="mt-2 text-sm text-gray-600">

                          {interview
                            .jobDescription
                            .company && (
                            <span>
                              {
                                interview
                                  .jobDescription
                                  .company
                              }
                            </span>
                          )}

                          {interview
                            .jobDescription
                            .role && (
                            <span>
                              {" "}
                              •{" "}
                              {
                                interview
                                  .jobDescription
                                  .role
                              }
                            </span>
                          )}

                        </p>
                      )}

                    </div>


                    {/* ====================================== */}
                    {/* SCORES */}
                    {/* ====================================== */}

                    <div className="flex items-center gap-3">

                      {/* SCORE */}

                      <div className="min-w-[105px] rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-center">

                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Score
                        </p>

                        <p className="mt-1 text-xl font-bold text-gray-900">

                          {score !== null &&
                          score !==
                            undefined
                            ? `${score}/10`
                            : "—"}

                        </p>

                      </div>


                      {/* MATCH */}

                      <div className="min-w-[105px] rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-center">

                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Match
                        </p>

                        <p className="mt-1 text-xl font-bold text-gray-900">

                          {match !== null &&
                          match !==
                            undefined
                            ? `${match}%`
                            : "—"}

                        </p>

                      </div>

                    </div>

                  </div>


                  {/* ======================================== */}
                  {/* BOTTOM SECTION */}
                  {/* ======================================== */}

                  <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="text-sm text-gray-500">

                      Completed rounds:{" "}
                      <span className="font-medium text-gray-700">
                        {
                          interview.completedRounds ??
                          0
                        }
                      </span>

                    </div>


                    <Link
                      to={`/interviews/${interview._id}`}
                      className="inline-flex w-fit items-center gap-2 rounded-lg border border-orange-200 px-4 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-50"
                    >
                      View Details

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>

                    </Link>

                  </div>

                </div>
              );
            }
          )}

        </div>

      </div>

    </div>
  );
};


export default InterviewHistory;