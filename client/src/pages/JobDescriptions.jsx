import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  createJobDescription,
  uploadJobDescription,
  getJobDescriptions,
  deleteJobDescription,
} from "../services/api";

import { useAuth } from "../context/AuthContext";

function JobDescriptions() {
  const { user } = useAuth();

  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState("text");

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [descriptionText, setDescriptionText] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchJobDescriptions();
  }, []);

  const fetchJobDescriptions = async () => {
    try {
      setLoading(true);

      const data = await getJobDescriptions(token);

      setJobDescriptions(data.jobDescriptions || []);
    } catch (err) {
      setError(
        err.message || "Unable to load job descriptions"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setCompany("");
    setRole("");
    setDescriptionText("");
    setSelectedFile(null);

    const fileInput = document.getElementById(
      "jd-file-input"
    );

    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const extension = file.name
      .split(".")
      .pop()
      ?.toLowerCase();

    if (!["pdf", "docx"].includes(extension)) {
      setError("Only PDF and DOCX files are allowed.");
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10 MB.");
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!title.trim()) {
      setError("Please enter a title for this job description.");
      return;
    }

    if (mode === "text" && !descriptionText.trim()) {
      setError("Please paste the job description.");
      return;
    }

    if (mode === "file" && !selectedFile) {
      setError("Please select a PDF or DOCX file.");
      return;
    }

    try {
      setSubmitting(true);

      if (mode === "text") {
        await createJobDescription(
          {
            title,
            company,
            role,
            descriptionText,
          },
          token
        );
      } else {
        await uploadJobDescription(
          selectedFile,
          {
            title,
            company,
            role,
          },
          token
        );
      }

      setMessage(
        mode === "text"
          ? "Job description saved successfully."
          : "Job description uploaded successfully."
      );

      resetForm();

      await fetchJobDescriptions();
    } catch (err) {
      setError(
        err.message || "Unable to save job description."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this job description?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await deleteJobDescription(id, token);

      setJobDescriptions((previous) =>
        previous.filter((item) => item._id !== id)
      );

      setMessage(
        "Job description deleted successfully."
      );
    } catch (err) {
      setError(
        err.message || "Unable to delete job description."
      );
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

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

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link
          to="/dashboard"
          className="text-orange-600 hover:text-orange-700"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-semibold text-gray-900">
            Job Descriptions
          </h1>

          <p className="mt-2 text-gray-600">
            Save job descriptions you want to use for
            resume matching, ATS analysis and interview
            preparation.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-orange-100 bg-white p-7 shadow-sm">
          <div className="flex flex-wrap gap-3 border-b border-orange-100 pb-5">
            <button
              type="button"
              onClick={() => {
                setMode("text");
                setError("");
              }}
              className={`rounded-lg px-5 py-2.5 text-sm font-medium transition ${
                mode === "text"
                  ? "bg-orange-500 text-white"
                  : "border border-orange-200 text-orange-600 hover:bg-orange-50"
              }`}
            >
              Paste JD
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("file");
                setError("");
              }}
              className={`rounded-lg px-5 py-2.5 text-sm font-medium transition ${
                mode === "file"
                  ? "bg-orange-500 text-white"
                  : "border border-orange-200 text-orange-600 hover:bg-orange-50"
              }`}
            >
              Upload JD
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6"
          >
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  JD title *
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="e.g. SDE I - Backend"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Company
                </label>

                <input
                  type="text"
                  value={company}
                  onChange={(e) =>
                    setCompany(e.target.value)
                  }
                  placeholder="e.g. Galaxy.ai"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Role
                </label>

                <input
                  type="text"
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value)
                  }
                  placeholder="e.g. Backend Developer"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </div>
            </div>

            {mode === "text" ? (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Job description *
                </label>

                <textarea
                  value={descriptionText}
                  onChange={(e) =>
                    setDescriptionText(e.target.value)
                  }
                  rows={12}
                  placeholder="Paste the complete job description here..."
                  className="w-full resize-y rounded-lg border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </div>
            ) : (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Job description file *
                </label>

                <div className="rounded-xl border border-dashed border-orange-200 bg-[#fffaf5] p-7">
                  <input
                    id="jd-file-input"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-600"
                  />

                  <p className="mt-3 text-sm text-gray-500">
                    PDF or DOCX, maximum 10 MB.
                  </p>

                  {selectedFile && (
                    <p className="mt-3 text-sm font-medium text-orange-600">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-5 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-600">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 rounded-lg bg-orange-500 px-6 py-3 font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Saving..."
                : mode === "text"
                ? "Save job description"
                : "Upload job description"}
            </button>
          </form>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Saved job descriptions
            </h2>

            <span className="text-sm text-gray-500">
              {jobDescriptions.length}{" "}
              {jobDescriptions.length === 1
                ? "job description"
                : "job descriptions"}
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-orange-100 bg-white p-8 text-center shadow-sm">
              <p className="text-gray-500">
                Loading job descriptions...
              </p>
            </div>
          ) : jobDescriptions.length === 0 ? (
            <div className="rounded-2xl border border-orange-100 bg-white p-10 text-center shadow-sm">
              <h3 className="font-semibold text-gray-900">
                No job descriptions yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Paste or upload a job description above
                to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobDescriptions.map((jd) => (
                <div
                  key={jd._id}
                  className="flex flex-col gap-5 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {jd.title}
                      </h3>

                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
                        {jd.sourceType === "file"
                          ? jd.fileType?.toUpperCase()
                          : "TEXT"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                      {jd.company && (
                        <span>{jd.company}</span>
                      )}

                      {jd.role && (
                        <span>{jd.role}</span>
                      )}

                      <span>
                        Saved {formatDate(jd.createdAt)}
                      </span>
                    </div>

                    {jd.originalName && (
                      <p className="mt-2 text-sm text-gray-500">
                        File: {jd.originalName}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Link
                      to={`/job-descriptions/${jd._id}`}
                      className="rounded-lg border border-orange-200 px-4 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-50"
                    >
                      View
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(jd._id)
                      }
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default JobDescriptions;