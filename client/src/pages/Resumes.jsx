import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  deleteResume,
  getResumes,
  setDefaultResume,
  uploadResume,
} from "../services/api";

import { useAuth } from "../context/AuthContext";

const formatFileSize = (bytes) => {
  if (!bytes) return "0 KB";

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Resumes = () => {
  const { user } = useAuth();

  const fileInputRef = useRef(null);

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  const loadResumes = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getResumes(token);

      setResumes(data.resumes || []);
    } catch (err) {
      setError(err.message || "Failed to load resumes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a PDF or DOCX file.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Resume must be smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);

      const data = await uploadResume(file, token);

      setSuccess(data.message || "Resume uploaded successfully.");

      await loadResumes();
    } catch (err) {
      setError(err.message || "Failed to upload resume.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSetDefault = async (resumeId) => {
    try {
      setError("");
      setSuccess("");
      setSettingDefaultId(resumeId);

      await setDefaultResume(resumeId, token);

      // Update the UI immediately.
      setResumes((current) =>
        current.map((resume) => ({
          ...resume,
          isDefault: resume._id === resumeId,
        }))
      );

      setSuccess("Default resume updated successfully.");
    } catch (err) {
      setError(
        err.message || "Failed to set default resume."
      );
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDelete = async (resumeId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resume?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteResume(resumeId, token);

      setResumes((current) =>
        current.filter(
          (resume) => resume._id !== resumeId
        )
      );

      setSuccess("Resume deleted successfully.");

      // Refresh from backend so that if the deleted
      // resume was default, the automatically selected
      // default resume is reflected in the UI.
      await loadResumes();
    } catch (err) {
      setError(
        err.message || "Failed to delete resume."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf5] text-[#292524]">
      {/* Header */}

      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            to="/dashboard"
            className="text-xl font-semibold tracking-tight text-[#292524]"
          >
            crackd<span className="text-orange-500">.</span>ai
          </Link>

          <div className="text-sm text-stone-500">
            {user?.name}
          </div>
        </div>
      </header>

      {/* Main */}

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="text-sm text-orange-600 hover:text-orange-700"
          >
            ← Back to dashboard
          </Link>

          <div className="mt-5">
            <h1 className="text-3xl font-semibold tracking-tight">
              Resume Manager
            </h1>

            <p className="mt-2 max-w-2xl text-stone-500">
              Upload and manage your resume versions,
              choose a default resume, and keep your
              applications organized.
            </p>
          </div>
        </div>

        {/* Upload section */}

        <section className="rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-medium">
                Upload a resume
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                PDF or DOCX, maximum 10 MB.
              </p>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={uploading}
                className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading
                  ? "Uploading..."
                  : "Choose resume"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}
        </section>

        {/* Resume list */}

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Your resumes
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                Choose one resume as your default for
                applications and other workflows.
              </p>
            </div>

            <span className="text-sm text-stone-500">
              {resumes.length}{" "}
              {resumes.length === 1
                ? "resume"
                : "resumes"}
            </span>
          </div>

          {loading ? (
            <div className="rounded-xl border border-orange-100 bg-white p-8 text-center text-sm text-stone-500">
              Loading resumes...
            </div>
          ) : resumes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-orange-200 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                📄
              </div>

              <h3 className="mt-4 font-medium">
                No resumes yet
              </h3>

              <p className="mt-1 text-sm text-stone-500">
                Upload your first resume to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <div
                  key={resume._id}
                  className={`flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-sm transition sm:flex-row sm:items-center sm:justify-between ${
                    resume.isDefault
                      ? "border-orange-300 ring-1 ring-orange-100"
                      : "border-orange-100"
                  }`}
                >
                  {/* Resume information */}

                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-sm font-semibold uppercase text-orange-600">
                      {resume.fileType}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="max-w-[260px] truncate font-medium text-stone-800 sm:max-w-md">
                          {resume.originalName}
                        </h3>

                        {resume.isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                            ⭐ Default
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500">
                        <span>
                          {formatFileSize(
                            resume.fileSize
                          )}
                        </span>

                        <span>
                          Uploaded{" "}
                          {formatDate(
                            resume.createdAt
                          )}
                        </span>

                        <span
                          className={
                            resume.extractionStatus ===
                            "completed"
                              ? "text-green-600"
                              : resume.extractionStatus ===
                                "failed"
                              ? "text-red-600"
                              : "text-orange-600"
                          }
                        >
                          {resume.extractionStatus ===
                          "completed"
                            ? "Text extracted"
                            : resume.extractionStatus ===
                              "failed"
                            ? "Extraction failed"
                            : "Processing"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to={`/resumes/${resume._id}`}
                      className="rounded-lg border border-orange-200 px-4 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-50"
                    >
                      View
                    </Link>

                    {!resume.isDefault && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSetDefault(
                            resume._id
                          )
                        }
                        disabled={
                          settingDefaultId ===
                          resume._id
                        }
                        className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {settingDefaultId ===
                        resume._id
                          ? "Setting..."
                          : "Set as Default"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(resume._id)
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
};

export default Resumes;