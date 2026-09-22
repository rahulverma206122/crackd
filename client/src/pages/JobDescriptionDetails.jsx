import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getJobDescriptionById } from "../services/api";
import { useAuth } from "../context/AuthContext";

function JobDescriptionDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [jobDescription, setJobDescription] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchJD = async () => {
      try {
        const token = localStorage.getItem("token");

        const data = await getJobDescriptionById(
          id,
          token
        );

        setJobDescription(data.jobDescription);
      } catch (err) {
        setError(
          err.message ||
            "Unable to load job description"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJD();
  }, [id]);

  const handleCopy = async () => {
    if (!jobDescription?.descriptionText) return;

    try {
      await navigator.clipboard.writeText(
        jobDescription.descriptionText
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
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

            <span className="text-gray-600">
              {user?.name}
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-2xl border border-orange-100 bg-white p-10 text-center shadow-sm">
            <p className="text-gray-500">
              Loading job description...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !jobDescription) {
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

            <span className="text-gray-600">
              {user?.name}
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-12">
          <Link
            to="/job-descriptions"
            className="text-orange-600 hover:text-orange-700"
          >
            ← Back to job descriptions
          </Link>

          <div className="mt-8 rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900">
              Unable to load job description
            </h1>

            <p className="mt-2 text-red-600">
              {error || "Job description not found"}
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

          <span className="text-gray-600">
            {user?.name}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link
          to="/job-descriptions"
          className="text-orange-600 hover:text-orange-700"
        >
          ← Back to job descriptions
        </Link>

        <div className="mt-6 rounded-2xl border border-orange-100 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {jobDescription.title}
              </h1>

              <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
                {jobDescription.company && (
                  <span>
                    Company: {jobDescription.company}
                  </span>
                )}

                {jobDescription.role && (
                  <span>
                    Role: {jobDescription.role}
                  </span>
                )}

                <span>
                  Source:{" "}
                  {jobDescription.sourceType === "file"
                    ? jobDescription.fileType?.toUpperCase()
                    : "Pasted text"}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="rounded-lg border border-orange-200 px-5 py-2.5 font-medium text-orange-600 transition hover:bg-orange-50"
            >
              {copied ? "Copied!" : "Copy text"}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-orange-100 bg-white shadow-sm">
          <div className="border-b border-orange-100 px-7 py-5">
            <h2 className="text-xl font-semibold text-gray-900">
              Job description
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              This text will later be analyzed against
              your resume by the AI matching system.
            </p>
          </div>

          <div className="p-7">
            <div className="max-h-[700px] overflow-y-auto rounded-xl border border-gray-200 bg-[#fffdfb] p-6">
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-gray-700">
                {jobDescription.descriptionText}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default JobDescriptionDetails;