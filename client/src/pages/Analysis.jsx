import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getResumes,
  getJobDescriptions,
  createAnalysis,
  getAnalyses,
} from "../services/api";

const Analysis = () => {
  const { token } = useAuth();

  const [resumes, setResumes] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [analyses, setAnalyses] = useState([]);

  const [selectedResume, setSelectedResume] = useState("");
  const [selectedJobDescription, setSelectedJobDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [resumeData, jdData, analysisData] = await Promise.all([
        getResumes(token),
        getJobDescriptions(token),
        getAnalyses(token),
      ]);

      console.log("Resume API:", resumeData);
      console.log("JD API:", jdData);
      console.log("Analysis API:", analysisData);

      setResumes(resumeData.resumes || []);
      setJobDescriptions(jdData.jobDescriptions || []);
      setAnalyses(analysisData.analyses || []);
    } catch (err) {
      console.error("Analysis page loading error:", err);
      setError(err.message || "Failed to load analysis data");
    } finally {
      setLoading(false);
    }
  };

  if (token) {
    loadData();
  }
}, [token]);

  const handleAnalyze = async () => {
    if (!selectedResume || !selectedJobDescription) {
      setError("Please select both a resume and a job description.");
      return;
    }

    try {
      setAnalyzing(true);
      setError("");
      setResult(null);

      const data = await createAnalysis(
        selectedResume,
        selectedJobDescription,
        token
      );

      setResult(data.analysis);

      setAnalyses((prev) => [data.analysis, ...prev]);
    } catch (err) {
      setError(err.message || "AI analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Strong Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Moderate Match";
    return "Needs Improvement";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <p className="text-gray-600">Loading analysis...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <div className="border-b border-orange-100 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <Link
                to="/dashboard"
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                ← Back to Dashboard
              </Link>

              <h1 className="mt-2 text-3xl font-bold text-gray-900">
                AI Resume Analysis
              </h1>

              <p className="mt-1 text-gray-600">
                Compare your resume with a job description using AI.
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        {/* Selection Card */}
        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Start New Analysis
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Select the resume and job description you want to compare.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {/* Resume */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Resume
              </label>

              <select
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">Select a resume</option>

                {resumes.map((resume) => (
                  <option key={resume._id} value={resume._id}>
                    {resume.originalName}
                  </option>
                ))}
              </select>

              {resumes.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  No resumes found.{" "}
                  <Link
                    to="/resumes"
                    className="font-medium text-orange-600 hover:underline"
                  >
                    Upload one
                  </Link>
                </p>
              )}
            </div>

            {/* Job Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Job Description
              </label>

              <select
                value={selectedJobDescription}
                onChange={(e) => setSelectedJobDescription(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">Select a job description</option>

                {jobDescriptions.map((jd) => (
                  <option key={jd._id} value={jd._id}>
                    {jd.title}
                    {jd.company ? ` — ${jd.company}` : ""}
                  </option>
                ))}
              </select>

              {jobDescriptions.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  No job descriptions found.{" "}
                  <Link
                    to="/job-descriptions"
                    className="font-medium text-orange-600 hover:underline"
                  >
                    Add one
                  </Link>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={
              analyzing || !selectedResume || !selectedJobDescription
            }
            className="mt-6 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
          >
            {analyzing ? "Analyzing with AI..." : "Analyze with AI"}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-8 space-y-6">
            {/* Score */}
            <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-sm">
              <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide text-orange-600">
                    ATS Compatibility
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-gray-900">
                    {getScoreLabel(result.atsScore)}
                  </h2>

                  <p className="mt-2 max-w-2xl text-gray-600">
                    {result.summary}
                  </p>
                </div>

                <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full border-8 border-orange-200">
                  <span className="text-4xl font-bold text-orange-600">
                    {result.atsScore}
                  </span>

                  <span className="text-sm text-gray-500">/ 100</span>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="grid gap-6 md:grid-cols-3">
              <SkillCard
                title="Matched Skills"
                items={result.matchedSkills}
                type="matched"
              />

              <SkillCard
                title="Partial Skills"
                items={result.partialSkills}
                type="partial"
              />

              <SkillCard
                title="Missing Skills"
                items={result.missingSkills}
                type="missing"
              />
            </div>

            {/* Keywords */}
            <div className="grid gap-6 md:grid-cols-2">
              <ListCard
                title="Keyword Matches"
                items={result.keywordMatches}
              />

              <ListCard
                title="Important Keywords Missing"
                items={result.importantKeywordsMissing}
              />
            </div>

            {/* Strengths & Gaps */}
            <div className="grid gap-6 md:grid-cols-2">
              <ListCard
                title="Resume Strengths"
                items={result.resumeStrengths}
              />

              <ListCard
                title="Resume Gaps"
                items={result.resumeGaps}
              />
            </div>

            {/* Skill Analysis */}
            <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                Detailed Skill Analysis
              </h2>

              <div className="mt-5 space-y-4">
                {result.skillAnalysis?.map((item, index) => (
                  <div
                    key={`${item.skill}-${index}`}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-semibold text-gray-900">
                        {item.skill}
                      </h3>

                      <StatusBadge status={item.status} />
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      {item.evidence}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                AI Recommendations
              </h2>

              <div className="mt-5 space-y-3">
                {result.recommendations?.map((recommendation, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-xl bg-orange-50 p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                      {index + 1}
                    </span>

                    <p className="text-sm leading-6 text-gray-700">
                      {recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Previous Analyses */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900">
            Previous Analyses
          </h2>

          {analyses.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-orange-200 bg-white p-8 text-center">
              <p className="text-gray-500">
                No previous analyses yet.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4">
              {analyses.map((analysis) => (
                <div
                  key={analysis._id}
                  className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {analysis.jobDescription?.title ||
                          "Job Description"}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Resume:{" "}
                        {analysis.resume?.originalName || "Resume"}
                      </p>

                      {analysis.jobDescription?.company && (
                        <p className="text-sm text-gray-500">
                          {analysis.jobDescription.company}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-3xl font-bold text-orange-600">
                        {analysis.atsScore}
                      </p>

                      <p className="text-xs text-gray-500">ATS Score</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const SkillCard = ({ title, items = [], type }) => {
  const styles = {
    matched: "border-green-100 bg-green-50",
    partial: "border-yellow-100 bg-yellow-50",
    missing: "border-red-100 bg-red-50",
  };

  const badgeStyles = {
    matched: "bg-green-100 text-green-700",
    partial: "bg-yellow-100 text-yellow-700",
    missing: "bg-red-100 text-red-700",
  };

  return (
    <div className={`rounded-2xl border p-6 ${styles[type]}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{title}</h2>

        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${badgeStyles[type]}`}
        >
          {items.length}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="rounded-lg bg-white px-3 py-2 text-sm text-gray-700 shadow-sm"
            >
              {item}
            </span>
          ))
        ) : (
          <p className="text-sm text-gray-500">None identified.</p>
        )}
      </div>
    </div>
  );
};

const ListCard = ({ title, items = [] }) => {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>

        <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
          {items.length}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700"
            >
              {item}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">None identified.</p>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    matched: "bg-green-100 text-green-700",
    partial: "bg-yellow-100 text-yellow-700",
    missing: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
};

export default Analysis;