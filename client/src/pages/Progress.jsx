import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

import {
  getInterviewHistory,
  getInterviewAnalytics,
} from "../services/api";

import { useAuth } from "../context/AuthContext";

const Progress = () => {
  const { token } = useAuth();

  const [interviews, setInterviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ======================================================
  // LOAD INTERVIEW PROGRESS + ANALYTICS
  // ======================================================

  useEffect(() => {
    const loadProgress = async () => {
      try {
        setLoading(true);
        setError("");

        const [historyResponse, analyticsResponse] =
          await Promise.all([
            getInterviewHistory(token),
            getInterviewAnalytics(token),
          ]);

        setInterviews(historyResponse.interviews || []);

        setAnalytics(
          analyticsResponse.analytics || null
        );
      } catch (err) {
        setError(
          err.message ||
            "Failed to load interview progress"
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadProgress();
    }
  }, [token]);

  // ======================================================
  // SAFE ANALYTICS VALUES
  // ======================================================

  const overallStats = useMemo(() => {
    if (!analytics) {
      return {
        totalInterviews: interviews.length,
        overallScore: 0,
        overallMatch: 0,
        totalQuestions: 0,
        answeredQuestions: 0,
      };
    }

    return {
      totalInterviews:
        analytics.totalInterviews ??
        interviews.length,

      overallScore:
        Number(analytics.overallScore || 0),

      overallMatch:
        Number(
          analytics.overallMatchPercentage || 0
        ),

      totalQuestions:
        Number(
          analytics.totalQuestions || 0
        ),

      answeredQuestions:
        Number(
          analytics.answeredQuestions || 0
        ),
    };
  }, [analytics, interviews]);

  // ======================================================
  // DIFFICULTY PERFORMANCE
  // ======================================================

  const difficultyData = useMemo(() => {
    const performance =
      analytics?.difficultyPerformance || {};

    return ["easy", "medium", "hard"].map(
      (difficulty) => {
        const item =
          performance[difficulty] || {};

        return {
          difficulty:
            difficulty.charAt(0).toUpperCase() +
            difficulty.slice(1),

          score:
            Number(item.averageScore || 0),

          match:
            Number(
              item.averageMatchPercentage || 0
            ),

          totalQuestions:
            Number(item.totalQuestions || 0),

          answeredQuestions:
            Number(
              item.answeredQuestions || 0
            ),
        };
      }
    );
  }, [analytics]);

  // ======================================================
  // QUESTION TYPE PERFORMANCE
  // ======================================================

  const categoryData = useMemo(() => {
    const performance =
      analytics?.categoryPerformance || {};

    const order = [
      "technical",
      "project",
      "behavioral",
      "general",
    ];

    return order.map((type) => {
      const item =
        performance[type] || {};

      return {
        type,
        label: formatType(type),

        score:
          Number(item.averageScore || 0),

        match:
          Number(
            item.averageMatchPercentage || 0
          ),

        totalQuestions:
          Number(item.totalQuestions || 0),

        answeredQuestions:
          Number(
            item.answeredQuestions || 0
          ),
      };
    });
  }, [analytics]);

  // ======================================================
  // INTERVIEW TREND
  // ======================================================

  const trendData = useMemo(() => {
    return (
      analytics?.interviewTrend || []
    ).map((item, index) => ({
      interview:
        item.interviewNumber
          ? `Interview ${item.interviewNumber}`
          : `Interview ${index + 1}`,

      score:
        typeof item.averageScore ===
        "number"
          ? Number(
              item.averageScore.toFixed(1)
            )
          : null,

      match:
        typeof item.averageMatchPercentage ===
        "number"
          ? Number(
              item.averageMatchPercentage
            )
          : null,
    }));
  }, [analytics]);

  // ======================================================
  // STRENGTHS
  // ======================================================

 const strengths = useMemo(() => {
  if (!Array.isArray(analytics?.strengths)) {
    return [];
  }

  return analytics.strengths.map((item) => {
    if (typeof item === "string") {
      return item;
    }

    return item?.text || "";
  }).filter(Boolean);
}, [analytics]);

  // ======================================================
  // IMPROVEMENT AREAS
  // ======================================================

 const improvementAreas = useMemo(() => {
  if (!Array.isArray(analytics?.improvementAreas)) {
    return [];
  }

  return analytics.improvementAreas
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      return item?.text || "";
    })
    .filter(Boolean);
}, [analytics]);

  // ======================================================
  // FORMATTERS
  // ======================================================

  function formatType(type) {
    if (!type) return "Mixed";

    return (
      type.charAt(0).toUpperCase() +
      type.slice(1)
    );
  }

  function formatDate(date) {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  // ======================================================
  // TOOLTIP
  // ======================================================

  const ScoreTooltip = ({
    active,
    payload,
    label,
  }) => {
    if (
      !active ||
      !payload ||
      !payload.length
    ) {
      return null;
    }

    return (
      <div className="rounded-xl border border-orange-100 bg-white px-4 py-3 shadow-lg">
        <p className="text-xs font-medium text-stone-500">
          {label}
        </p>

        <p className="mt-1 text-sm font-bold text-stone-900">
          Score: {payload[0].value}/10
        </p>
      </div>
    );
  };

  const MatchTooltip = ({
    active,
    payload,
    label,
  }) => {
    if (
      !active ||
      !payload ||
      !payload.length
    ) {
      return null;
    }

    return (
      <div className="rounded-xl border border-orange-100 bg-white px-4 py-3 shadow-lg">
        <p className="text-xs font-medium text-stone-500">
          {label}
        </p>

        <p className="mt-1 text-sm font-bold text-stone-900">
          Answer Match: {payload[0].value}%
        </p>
      </div>
    );
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-orange-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

            <p className="text-sm text-stone-500">
              Loading your progress...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ======================================================
  // ERROR
  // ======================================================

  if (error) {
    return (
      <div className="min-h-screen bg-orange-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">
              Unable to load progress
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <Link
              to="/dashboard"
              className="mt-5 inline-flex rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ======================================================
  // MAIN PAGE
  // ======================================================

  return (
    <div className="min-h-screen bg-orange-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/dashboard"
              className="text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900">
              Your Progress
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              Track your interview performance and
              improvement over time.
            </p>
          </div>

          <Link
            to="/interview"
            className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            Start New Interview
          </Link>
        </div>

        {/* ==================================================
            EMPTY STATE
        ================================================== */}

        {interviews.length === 0 ? (
          <div className="rounded-2xl border border-orange-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
              📈
            </div>

            <h2 className="mt-5 text-xl font-semibold text-stone-900">
              No interview progress yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
              Complete your first AI interview and
              your performance statistics will appear
              here.
            </p>

            <Link
              to="/interview"
              className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Start Your First Interview
            </Link>
          </div>
        ) : (
          <>
            {/* ==================================================
                OVERALL STATS
            ================================================== */}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* Total Interviews */}
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <p className="text-sm text-stone-500">
                  Total Interviews
                </p>

                <p className="mt-2 text-3xl font-bold text-stone-900">
                  {overallStats.totalInterviews}
                </p>

                <p className="mt-1 text-xs text-stone-400">
                  Completed attempts
                </p>
              </div>

              {/* Overall Score */}
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <p className="text-sm text-stone-500">
                  Overall Score
                </p>

                <p className="mt-2 text-3xl font-bold text-stone-900">
                  {overallStats.overallScore.toFixed(
                    1
                  )}

                  <span className="ml-1 text-base font-medium text-stone-400">
                    /10
                  </span>
                </p>

                <p className="mt-1 text-xs text-stone-400">
                  Average interview performance
                </p>
              </div>

              {/* Answer Match */}
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <p className="text-sm text-stone-500">
                  Answer Match
                </p>

                <p className="mt-2 text-3xl font-bold text-stone-900">
                  {Math.round(
                    overallStats.overallMatch
                  )}
                  %
                </p>

                <p className="mt-1 text-xs text-stone-400">
                  Conceptual correctness
                </p>
              </div>

              {/* Questions */}
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <p className="text-sm text-stone-500">
                  Questions Answered
                </p>

                <p className="mt-2 text-3xl font-bold text-stone-900">
                  {overallStats.answeredQuestions}
                </p>

                <p className="mt-1 text-xs text-stone-400">
                  Out of {overallStats.totalQuestions}{" "}
                  questions
                </p>
              </div>
            </div>

            {/* ==================================================
                INTERVIEW TREND
            ================================================== */}

            <div className="mt-6 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">
                    Interview Performance Trend
                  </h2>

                  <p className="mt-1 text-sm text-stone-500">
                    Track how your interview performance
                    changes across attempts.
                  </p>
                </div>

                <div className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600">
                  Score
                </div>
              </div>

              {trendData.length > 0 ? (
                <div className="mt-6 h-80 w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={trendData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -15,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="interview"
                        tick={{
                          fontSize: 11,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        domain={[0, 10]}
                        ticks={[
                          0,
                          2,
                          4,
                          6,
                          8,
                          10,
                        ]}
                        tick={{
                          fontSize: 11,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip
                        content={<ScoreTooltip />}
                      />

                      <Line
                        type="monotone"
                        dataKey="score"
                        strokeWidth={3}
                        dot={{
                          r: 4,
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="mt-8 flex h-64 items-center justify-center rounded-xl bg-orange-50">
                  <p className="text-sm text-stone-500">
                    No trend data available yet.
                  </p>
                </div>
              )}
            </div>

            {/* ==================================================
                ANSWER MATCH TREND
            ================================================== */}

            <div className="mt-6 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">
                    Answer Match Trend
                  </h2>

                  <p className="mt-1 text-sm text-stone-500">
                    Track your conceptual correctness
                    across interviews.
                  </p>
                </div>

                <div className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600">
                  %
                </div>
              </div>

              {trendData.some(
                (item) => item.match !== null
              ) ? (
                <div className="mt-6 h-80 w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={trendData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -15,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="interview"
                        tick={{
                          fontSize: 11,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        domain={[0, 100]}
                        ticks={[
                          0,
                          20,
                          40,
                          60,
                          80,
                          100,
                        ]}
                        tick={{
                          fontSize: 11,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip
                        content={<MatchTooltip />}
                      />

                      <Line
                        type="monotone"
                        dataKey="match"
                        strokeWidth={3}
                        dot={{
                          r: 4,
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="mt-8 flex h-64 items-center justify-center rounded-xl bg-orange-50">
                  <p className="text-sm text-stone-500">
                    No answer match data available
                    yet.
                  </p>
                </div>
              )}
            </div>

            {/* ==================================================
                DIFFICULTY PERFORMANCE
            ================================================== */}

            <div className="mt-6 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">
                  Performance by Difficulty
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  See how you perform as interview
                  questions become more challenging.
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {difficultyData.map((item) => (
                  <div
                    key={item.difficulty}
                    className="rounded-xl border border-orange-100 bg-orange-50/40 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-stone-900">
                        {item.difficulty}
                      </span>

                      <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-orange-600">
                        {item.answeredQuestions}{" "}
                        answered
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-stone-500">
                          Avg Score
                        </p>

                        <p className="mt-1 text-xl font-bold text-stone-900">
                          {item.score.toFixed(1)}
                          /10
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-stone-500">
                          Avg Match
                        </p>

                        <p className="mt-1 text-xl font-bold text-stone-900">
                          {Math.round(
                            item.match
                          )}
                          %
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-stone-400">
                      {item.totalQuestions} total
                      questions
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ==================================================
                CATEGORY PERFORMANCE
            ================================================== */}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">

              {/* Category Table */}
              <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">
                    Performance by Question Type
                  </h2>

                  <p className="mt-1 text-sm text-stone-500">
                    Compare your performance across
                    interview categories.
                  </p>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left">
                    <thead>
                      <tr className="border-b border-orange-100 text-xs text-stone-500">
                        <th className="pb-3 font-medium">
                          Type
                        </th>

                        <th className="pb-3 font-medium">
                          Questions
                        </th>

                        <th className="pb-3 font-medium">
                          Score
                        </th>

                        <th className="pb-3 font-medium">
                          Match
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {categoryData.map(
                        (item) => (
                          <tr
                            key={item.type}
                            className="border-b border-orange-50 last:border-0"
                          >
                            <td className="py-4">
                              <span className="inline-flex rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600">
                                {item.label}
                              </span>
                            </td>

                            <td className="py-4 text-sm text-stone-700">
                              {item.answeredQuestions}
                            </td>

                            <td className="py-4 text-sm font-semibold text-stone-900">
                              {item.score.toFixed(
                                1
                              )}
                              /10
                            </td>

                            <td className="py-4 text-sm font-semibold text-stone-900">
                              {Math.round(
                                item.match
                              )}
                              %
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category Chart */}
              <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">
                    Category Score
                  </h2>

                  <p className="mt-1 text-sm text-stone-500">
                    Average score across question
                    categories.
                  </p>
                </div>

                <div className="mt-6 h-72">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={categoryData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -15,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="label"
                        tick={{
                          fontSize: 11,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        domain={[0, 10]}
                        ticks={[
                          0,
                          2,
                          4,
                          6,
                          8,
                          10,
                        ]}
                        tick={{
                          fontSize: 11,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="score"
                        radius={[
                          6,
                          6,
                          0,
                          0,
                        ]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ==================================================
                STRENGTHS + IMPROVEMENT AREAS
            ================================================== */}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">

              {/* Strengths */}
              <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg">
                    ✓
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-stone-900">
                      Your Strengths
                    </h2>

                    <p className="mt-1 text-sm text-stone-500">
                      Areas that repeatedly appeared
                      as strengths in your interview
                      evaluations.
                    </p>
                  </div>
                </div>

                {strengths.length > 0 ? (
                  <div className="mt-6 space-y-3">
                    {strengths.map(
                      (strength, index) => (
                        <div
                          key={`${strength}-${index}`}
                          className="flex items-start gap-3 rounded-xl border border-orange-100 bg-orange-50/40 p-4"
                        >
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                            {index + 1}
                          </span>

                          <p className="text-sm leading-6 text-stone-700">
                            {strength}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl bg-orange-50 p-5">
                    <p className="text-sm text-stone-500">
                      Strength insights will appear
                      after you complete more interview
                      questions.
                    </p>
                  </div>
                )}
              </div>

              {/* Improvements */}
              <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg">
                    ↑
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-stone-900">
                      Improvement Areas
                    </h2>

                    <p className="mt-1 text-sm text-stone-500">
                      Areas that can be improved based
                      on your interview evaluations.
                    </p>
                  </div>
                </div>

                {improvementAreas.length >
                0 ? (
                  <div className="mt-6 space-y-3">
                    {improvementAreas.map(
                      (
                        improvement,
                        index
                      ) => (
                        <div
                          key={`${improvement}-${index}`}
                          className="flex items-start gap-3 rounded-xl border border-orange-100 bg-orange-50/40 p-4"
                        >
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                            {index + 1}
                          </span>

                          <p className="text-sm leading-6 text-stone-700">
                            {improvement}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl bg-orange-50 p-5">
                    <p className="text-sm text-stone-500">
                      Improvement insights will appear
                      after your interview evaluations
                      contain enough data.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ==================================================
                RECENT ATTEMPTS
            ================================================== */}

            <div className="mt-6 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">
                    Recent Attempts
                  </h2>

                  <p className="mt-1 text-sm text-stone-500">
                    Review your latest interview
                    performance.
                  </p>
                </div>

                <Link
                  to="/interview-history"
                  className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                >
                  View all →
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {interviews
                  .slice(0, 5)
                  .map((interview) => (
                    <Link
                      key={interview._id}
                      to={`/interviews/${interview._id}`}
                      className="block rounded-xl border border-orange-100 p-4 transition hover:border-orange-200 hover:bg-orange-50/40"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                              {formatType(
                                interview.interviewType
                              )}
                            </span>

                            <span className="text-xs text-stone-400">
                              {formatDate(
                                interview.createdAt
                              )}
                            </span>
                          </div>

                          <p className="mt-2 text-sm font-semibold text-stone-900">
                            {interview
                              .jobDescription
                              ?.company ||
                              "General Interview"}
                          </p>

                          <p className="mt-1 text-xs text-stone-500">
                            {interview
                              .jobDescription
                              ?.role ||
                              "No specific role"}
                          </p>
                        </div>

                        <div className="flex gap-5">
                          <div>
                            <p className="text-[11px] text-stone-400">
                              Score
                            </p>

                            <p className="mt-1 text-sm font-bold text-stone-900">
                              {typeof interview.overallScore ===
                              "number"
                                ? `${interview.overallScore.toFixed(
                                    1
                                  )}/10`
                                : "N/A"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] text-stone-400">
                              Match
                            </p>

                            <p className="mt-1 text-sm font-bold text-stone-900">
                              {typeof interview.overallMatchPercentage ===
                              "number"
                                ? `${interview.overallMatchPercentage}%`
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Progress;