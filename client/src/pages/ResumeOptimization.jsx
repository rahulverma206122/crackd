import { useEffect, useState } from "react";

import {
  createOptimization,
  getOptimizations,
  getResumes,
  getJobDescriptions,
} from "../services/api";

import { useAuth } from "../context/AuthContext";

const ResumeOptimization = () => {
  const { token } = useAuth();

  const [resumes, setResumes] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);

  const [selectedResume, setSelectedResume] = useState("");
  const [selectedJobDescription, setSelectedJobDescription] =
    useState("");

  const [optimization, setOptimization] = useState(null);
  const [previousOptimizations, setPreviousOptimizations] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState("");

  // ======================================================
  // LOAD DATA
  // ======================================================

  useEffect(() => {
    const loadData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError("");

        const [resumeData, jdData, optimizationData] =
          await Promise.all([
            getResumes(token),
            getJobDescriptions(token),
            getOptimizations(token),
          ]);

        setResumes(resumeData.resumes || []);
        setJobDescriptions(jdData.jobDescriptions || []);
        setPreviousOptimizations(
          optimizationData.optimizations || []
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message || "Failed to load optimization data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  // ======================================================
  // OPTIMIZE RESUME
  // ======================================================

  const handleOptimize = async () => {
    if (!selectedResume || !selectedJobDescription) {
      setError(
        "Please select a resume and job description."
      );
      return;
    }

    try {
      setOptimizing(true);
      setError("");
      setOptimization(null);

      const data = await createOptimization(
        selectedResume,
        selectedJobDescription,
        token
      );

      setOptimization(data.optimization);

      const updated = await getOptimizations(token);

      setPreviousOptimizations(
        updated.optimizations || []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Failed to optimize resume"
      );
    } finally {
      setOptimizing(false);
    }
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 p-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-gray-600">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // ======================================================
  // MAIN UI
  // ======================================================

  return (
    <div className="min-h-screen bg-orange-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">

        {/* HEADER */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Resume Optimization
          </h1>

          <p className="mt-2 text-gray-600">
            Find the important changes that can improve your
            resume for a specific job.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SELECT RESUME + JD */}

        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-semibold text-gray-900">
            Select Resume & Job
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">

            {/* RESUME */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Resume
              </label>

              <select
                value={selectedResume}
                onChange={(e) =>
                  setSelectedResume(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">
                  Select resume
                </option>

                {resumes.map((resume) => (
                  <option
                    key={resume._id}
                    value={resume._id}
                  >
                    {resume.originalName}
                  </option>
                ))}
              </select>
            </div>

            {/* JOB DESCRIPTION */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Job Description
              </label>

              <select
                value={selectedJobDescription}
                onChange={(e) =>
                  setSelectedJobDescription(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">
                  Select job description
                </option>

                {jobDescriptions.map((jd) => (
                  <option
                    key={jd._id}
                    value={jd._id}
                  >
                    {jd.title}
                    {jd.company
                      ? ` - ${jd.company}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <button
            onClick={handleOptimize}
            disabled={optimizing}
            className="mt-6 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {optimizing
              ? "Analyzing Resume..."
              : "Find Improvements"}
          </button>
        </div>

        {/* ==================================================
            RESULTS
        ================================================== */}

        {optimization && (
          <div className="mt-8 space-y-6">

            {/* SUMMARY */}

            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Optimization Summary
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                {optimization.suggestions?.length || 0}{" "}
                meaningful improvement
                {optimization.suggestions?.length === 1
                  ? ""
                  : "s"}{" "}
                found.
              </p>
            </div>

            {/* ==================================================
                SUGGESTED IMPROVEMENTS
            ================================================== */}

            {optimization.suggestions?.length > 0 && (
              <section>

                <h2 className="mb-4 text-xl font-semibold text-gray-900">
                  Suggested Improvements
                </h2>

                <div className="space-y-5">

                  {optimization.suggestions.map(
                    (suggestion, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"
                      >

                        {/* SECTION */}

                        <span className="inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
                          {suggestion.section}
                        </span>

                        {/* ORIGINAL */}

                        <div className="mt-5">
                          <p className="mb-2 text-sm font-semibold text-gray-500">
                            Replace
                          </p>

                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                            {suggestion.original}
                          </div>
                        </div>

                        {/* ARROW */}

                        <div className="py-3 text-center text-lg text-orange-500">
                          ↓
                        </div>

                        {/* REPLACEMENT */}

                        <div>
                          <p className="mb-2 text-sm font-semibold text-orange-600">
                            Suggested replacement
                          </p>

                          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm font-medium leading-6 text-gray-800">
                            {suggestion.replacement}
                          </div>
                        </div>

                        {/* REASON */}

                        <div className="mt-4">
                          <p className="mb-1 text-sm font-semibold text-gray-700">
                            Why?
                          </p>

                          <p className="text-sm leading-6 text-gray-600">
                            {suggestion.reason}
                          </p>
                        </div>

                      </div>
                    )
                  )}

                </div>
              </section>
            )}

            {/* ==================================================
                NO SUGGESTIONS
            ================================================== */}

            {(!optimization.suggestions ||
              optimization.suggestions.length === 0) && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <h2 className="font-semibold text-green-800">
                  No major changes needed
                </h2>

                <p className="mt-1 text-sm text-green-700">
                  Your resume is already reasonably aligned
                  with this job description.
                </p>
              </div>
            )}

            {/* ==================================================
                KEYWORDS TO ADD
            ================================================== */}

            {optimization.keywordsToAdd?.length > 0 && (
              <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">

                <h2 className="text-lg font-semibold text-gray-900">
                  Keywords You Can Add
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Only keywords supported by your existing
                  resume.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">

                  {optimization.keywordsToAdd.map(
                    (keyword, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700"
                      >
                        ✓ {keyword}
                      </span>
                    )
                  )}

                </div>
              </section>
            )}

            {/* ==================================================
                UNSUPPORTED KEYWORDS
            ================================================== */}

            {optimization.keywordsNotSupported?.length > 0 && (
              <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">

                <h2 className="text-lg font-semibold text-gray-900">
                  Don't Add These Yet
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Your resume doesn't provide evidence for
                  these skills or technologies.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">

                  {optimization.keywordsNotSupported.map(
                    (keyword, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700"
                      >
                        ⚠ {keyword}
                      </span>
                    )
                  )}

                </div>
              </section>
            )}

            {/* ==================================================
                ATS IMPROVEMENTS
            ================================================== */}

            {optimization.atsImprovements?.length > 0 && (
              <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">

                <h2 className="text-lg font-semibold text-gray-900">
                  Important ATS Improvements
                </h2>

                <div className="mt-4 space-y-2">

                  {optimization.atsImprovements.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="rounded-xl bg-orange-50 p-3 text-sm text-gray-700"
                      >
                        • {item}
                      </div>
                    )
                  )}

                </div>
              </section>
            )}

          </div>
        )}

        {/* ==================================================
            PREVIOUS OPTIMIZATIONS
        ================================================== */}

        {previousOptimizations.length > 0 && (
          <section className="mt-10">

            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Previous Optimizations
            </h2>

            <div className="space-y-3">

              {previousOptimizations.map((item) => (
                <div
                  key={item._id}
                  className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm"
                >
                  <p className="font-medium text-gray-900">
                    {item.jobDescription?.title ||
                      "Job Description"}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {item.resume?.originalName ||
                      "Resume"}
                  </p>
                </div>
              ))}

            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default ResumeOptimization;