const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  "http://localhost:8000";

// ============================================================
// HELPER - PARSE AI SERVICE RESPONSE
// ============================================================

const parseResponse = async (response) => {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    detail:
      text || "AI service returned an invalid response",
  };
};

// ============================================================
// RESUME ANALYSIS
// ============================================================

const analyzeResumeAgainstJD = async (
  resumeText,
  jobDescription
) => {
  const response = await fetch(
    `${AI_SERVICE_URL}/analyze`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resume_text: resumeText,

        job_description:
          jobDescription || "",
      }),
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        "AI analysis service failed"
    );
  }

  return data.analysis;
};

// ============================================================
// RESUME OPTIMIZATION
// ============================================================

const optimizeResume = async (
  resumeText,
  jobDescription
) => {
  const response = await fetch(
    `${AI_SERVICE_URL}/optimize`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resume_text: resumeText,

        job_description:
          jobDescription || "",
      }),
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        "AI resume optimization service failed"
    );
  }

  return data.optimization;
};

// ============================================================
// START FIRST INTERVIEW ROUND
// ============================================================

const startInterview = async (
  resumeText,
  jobDescription,
  interviewType,
  resumeSourceId = null,
  jobDescriptionSourceId = null
) => {
  const response = await fetch(
    `${AI_SERVICE_URL}/interview/start`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resume_text: resumeText,

        job_description:
          jobDescription || "",

        interview_type:
          interviewType || "mixed",

        resume_source_id:
          resumeSourceId
            ? String(resumeSourceId)
            : null,

        job_description_source_id:
          jobDescriptionSourceId
            ? String(jobDescriptionSourceId)
            : null,
      }),
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        "AI interview start failed"
    );
  }

  return data;
};

// ============================================================
// EVALUATE INTERVIEW ANSWER
// ============================================================

const evaluateInterviewAnswer = async (
  resumeText,
  jobDescription,
  interviewType,
  question,
  answer,
  previousQuestions,
  resumeSourceId = null,
  jobDescriptionSourceId = null
) => {
  const response = await fetch(
    `${AI_SERVICE_URL}/interview/answer`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resume_text: resumeText,

        job_description:
          jobDescription || "",

        interview_type:
          interviewType || "mixed",

        question,

        answer,

        previous_questions:
          previousQuestions || [],

        resume_source_id:
          resumeSourceId
            ? String(resumeSourceId)
            : null,

        job_description_source_id:
          jobDescriptionSourceId
            ? String(jobDescriptionSourceId)
            : null,
      }),
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        "AI interview answer evaluation failed"
    );
  }

  return data;
};

// ============================================================
// GENERATE NEXT 10 INTERVIEW QUESTIONS
// WITH ADAPTIVE DIFFICULTY
// ============================================================

const generateNextInterviewBatch = async (
  resumeText,
  jobDescription,
  interviewType,
  previousQuestions,
  previousPerformance,
  resumeSourceId = null,
  jobDescriptionSourceId = null
) => {
  const response = await fetch(
    `${AI_SERVICE_URL}/interview/next-batch`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        resume_text: resumeText,

        job_description:
          jobDescription || "",

        interview_type:
          interviewType || "mixed",

        previous_questions:
          previousQuestions || [],

        previous_performance:
          previousPerformance || [],

        resume_source_id:
          resumeSourceId
            ? String(resumeSourceId)
            : null,

        job_description_source_id:
          jobDescriptionSourceId
            ? String(jobDescriptionSourceId)
            : null,
      }),
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        "AI next interview batch generation failed"
    );
  }

  return data;
};

// ============================================================
// AUDIO -> TEXT TRANSCRIPTION
// ============================================================

const transcribeAudio = async (
  audioBuffer,
  mimeType = "audio/webm",
  fileName = "answer.webm"
) => {
  if (!audioBuffer) {
    throw new Error(
      "Audio data is required"
    );
  }

  const formData = new FormData();

  const audioBlob = new Blob(
    [audioBuffer],
    {
      type:
        mimeType || "audio/webm",
    }
  );

  formData.append(
    "file",
    audioBlob,
    fileName || "answer.webm"
  );

  const response = await fetch(
    `${AI_SERVICE_URL}/transcribe`,
    {
      method: "POST",

      body: formData,
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        "Audio transcription failed"
    );
  }

  return data;
};

// ============================================================
// RAG - INDEX DOCUMENT
// ============================================================

const indexDocument = async (
  text,
  sourceId,
  sourceType
) => {
  if (!text || !text.trim()) {
    throw new Error(
      "Document text is required for RAG indexing"
    );
  }

  if (!sourceId) {
    throw new Error(
      "Source ID is required for RAG indexing"
    );
  }

  if (!sourceType) {
    throw new Error(
      "Source type is required for RAG indexing"
    );
  }

  const response = await fetch(
    `${AI_SERVICE_URL}/rag/index`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        source_id: String(sourceId),

        source_type: sourceType,

        text: text.trim(),
      }),
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        "RAG document indexing failed"
    );
  }

  return data;
};

// ============================================================
// RAG - SEARCH DOCUMENTS
// ============================================================

const searchRag = async (
  query,
  options = {}
) => {
  if (!query || !query.trim()) {
    throw new Error(
      "RAG search query is required"
    );
  }

  const {
    nResults = 5,
    sourceId = null,
    sourceType = null,
  } = options;

  const response = await fetch(
    `${AI_SERVICE_URL}/rag/search`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        query: query.trim(),

        n_results: nResults,

        source_id: sourceId
          ? String(sourceId)
          : null,

        source_type:
          sourceType || null,
      }),
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        "RAG search failed"
    );
  }

  return data;
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  analyzeResumeAgainstJD,
  optimizeResume,
  startInterview,
  evaluateInterviewAnswer,
  generateNextInterviewBatch,
  transcribeAudio,

  // RAG
  indexDocument,
  searchRag,
};