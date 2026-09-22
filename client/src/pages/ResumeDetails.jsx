import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getResumeById } from "../services/api";
import { useAuth } from "../context/AuthContext";

function ResumeDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Authentication required");
        }

        const data = await getResumeById(id, token);
        setResume(data.resume);
      } catch (err) {
        setError(err.message || "Unable to load resume");
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [id]);

  const handleCopy = async () => {
    if (!resume?.extractedText) return;

    try {
      await navigator.clipboard.writeText(resume.extractedText);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf5]">
        <header className="border-b border-orange-100 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <Link
              to="/dashboard"
              className="text-2xl font-bold text-gray-900"
            >
              crackd.ai
            </Link>

            <span className="text-gray-600">{user?.name}</span>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-2xl border border-orange-100 bg-white p-10 text-center shadow-sm">
            <p className="text-gray-500">Loading resume...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen bg-[#fffaf5]">
        <header className="border-b border-orange-100 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <Link
              to="/dashboard"
              className="text-2xl font-bold text-gray-900"
            >
              crackd.ai
            </Link>

            <span className="text-gray-600">{user?.name}</span>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-12">
          <Link
            to="/resumes"
            className="text-orange-600 hover:text-orange-700"
          >
            ← Back to resumes
          </Link>

          <div className="mt-8 rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900">
              Unable to load resume
            </h1>

            <p className="mt-2 text-red-600">
              {error || "Resume not found"}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf5]">
      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            to="/dashboard"
            className="text-2xl font-bold text-gray-900"
          >
            crackd.ai
          </Link>

          <span className="text-gray-600">{user?.name}</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link
          to="/resumes"
          className="text-orange-600 transition hover:text-orange-700"
        >
          ← Back to resumes
        </Link>

        <div className="mt-6">
          <div className="flex flex-col gap-5 rounded-2xl border border-orange-100 bg-white p-7 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-600">
                  {resume.fileType.toUpperCase()}
                </div>

                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {resume.originalName}
                  </h1>

                  <p className="mt-1 text-sm text-gray-500">
                    {formatFileSize(resume.fileSize)} · Uploaded{" "}
                    {formatDate(resume.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {resume.extractionStatus === "completed" && (
              <button
                onClick={handleCopy}
                className="rounded-lg border border-orange-200 px-5 py-2.5 font-medium text-orange-600 transition hover:bg-orange-50"
              >
                {copied ? "Copied!" : "Copy text"}
              </button>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-orange-100 bg-white shadow-sm">
            <div className="border-b border-orange-100 px-7 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Extracted text
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    This text will be used later for ATS scoring, job matching
                    and AI interview preparation.
                  </p>
                </div>

                {resume.extractionStatus === "completed" && (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-600">
                    Text extracted
                  </span>
                )}
              </div>
            </div>

            {resume.extractionStatus === "completed" ? (
              <div className="p-7">
                <div className="max-h-[650px] overflow-y-auto rounded-xl border border-gray-200 bg-[#fffdfb] p-6">
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-gray-700">
                    {resume.extractedText || "No text was extracted from this resume."}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center">
                <h3 className="font-semibold text-gray-900">
                  Text extraction failed
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  We couldn't extract readable text from this resume.
                  Please upload the resume again.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ResumeDetails;