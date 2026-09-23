const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  "http://localhost:8000";

// ============================================================
// AI SERVICE REQUEST CONFIGURATION
// ============================================================

const MAX_RETRIES = 4;

// Render Free services can take some time to wake up.
// These delays give the AI service enough time to start.
const RETRY_DELAYS = [
  5000,
  10000,
  15000,
  20000,
];

const REQUEST_TIMEOUT = 90000;

// ============================================================
// HELPER - SLEEP
// ============================================================

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

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
// HELPER - CHECK WHETHER ERROR SHOULD BE RETRIED
// ============================================================

const shouldRetryStatus = (status) => {
  return (
    status === 502 ||
    status === 503 ||
    status === 504
  );
};

// ============================================================
// HELPER - FETCH AI SERVICE WITH RETRIES
// ============================================================

const fetchAIService = async (
  path,
  requestFactory
) => {
  let lastError = null;

  for (
    let attempt = 0;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      const controller =
        new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, REQUEST_TIMEOUT);

      let response;

      try {
        response = await fetch(
          `${AI_SERVICE_URL}${path}`,
          {
            ...requestFactory(),
            signal: controller.signal,
          }
        );
      } finally {
        clearTimeout(timeout);
      }

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      if (response.ok) {
        return response;
      }

      // --------------------------------------------------------
      // TEMPORARY RENDER / NETWORK ERROR
      // --------------------------------------------------------

      if (
        shouldRetryStatus(
          response.status
        ) &&
        attempt < MAX_RETRIES
      ) {
        const retryDelay =
          RETRY_DELAYS[attempt];

        console.warn(
          `[AI SERVICE] ${response.status} from ${path}. ` +
            `Retrying in ${
              retryDelay / 1000
            } seconds... ` +
            `(attempt ${
              attempt + 1
            }/${MAX_RETRIES})`
        );

        // Consume response body before retrying.
        try {
          await response.text();
        } catch (error) {
          // Ignore response parsing errors.
        }

        await sleep(retryDelay);

        continue;
      }

      // --------------------------------------------------------
      // NON-RETRYABLE ERROR
      // --------------------------------------------------------

      return response;
    } catch (error) {
      lastError = error;

      const isAbortError =
        error?.name ===
        "AbortError";

      const isNetworkError =
        !error?.response;

      if (
        (isAbortError ||
          isNetworkError) &&
        attempt < MAX_RETRIES
      ) {
        const retryDelay =
          RETRY_DELAYS[attempt];

        console.warn(
          `[AI SERVICE] ${
            isAbortError
              ? "Request timed out"
              : "Network connection failed"
          } for ${path}. ` +
            `Retrying in ${
              retryDelay / 1000
            } seconds... ` +
            `(attempt ${
              attempt + 1
            }/${MAX_RETRIES})`
        );

        await sleep(retryDelay);

        continue;
      }

      break;
    }
  }

  throw new Error(
    `Unable to connect to AI service at ${AI_SERVICE_URL}${path}. ` +
      `The AI service may be starting up or temporarily unavailable. ` +
      `${
        lastError?.message ||
        "Connection failed"
      }`
  );
};

// ============================================================
// RESUME ANALYSIS
// ============================================================

const analyzeResumeAgainstJD = async (
  resumeText,
  jobDescription
) => {
  const response =
    await fetchAIService(
      "/analyze",
      () => ({
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          resume_text:
            resumeText,

          job_description:
            jobDescription || "",
        }),
      })
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
  const response =
    await fetchAIService(
      "/optimize",
      () => ({
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          resume_text:
            resumeText,

          job_description:
            jobDescription || "",
        }),
      })
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
  const response =
    await fetchAIService(
      "/interview/start",
      () => ({
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          resume_text:
            resumeText,

          job_description:
            jobDescription || "",

          interview_type:
            interviewType ||
            "mixed",

          resume_source_id:
            resumeSourceId
              ? String(
                  resumeSourceId
                )
              : null,

          job_description_source_id:
            jobDescriptionSourceId
              ? String(
                  jobDescriptionSourceId
                )
              : null,
        }),
      })
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
  const response =
    await fetchAIService(
      "/interview/answer",
      () => ({
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          resume_text:
            resumeText,

          job_description:
            jobDescription || "",

          interview_type:
            interviewType ||
            "mixed",

          question,

          answer,

          previous_questions:
            previousQuestions ||
            [],

          resume_source_id:
            resumeSourceId
              ? String(
                  resumeSourceId
                )
              : null,

          job_description_source_id:
            jobDescriptionSourceId
              ? String(
                  jobDescriptionSourceId
                )
              : null,
        }),
      })
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

const generateNextInterviewBatch =
  async (
    resumeText,
    jobDescription,
    interviewType,
    previousQuestions,
    previousPerformance,
    resumeSourceId = null,
    jobDescriptionSourceId = null
  ) => {
    const response =
      await fetchAIService(
        "/interview/next-batch",
        () => ({
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            resume_text:
              resumeText,

            job_description:
              jobDescription || "",

            interview_type:
              interviewType ||
              "mixed",

            previous_questions:
              previousQuestions ||
              [],

            previous_performance:
              previousPerformance ||
              [],

            resume_source_id:
              resumeSourceId
                ? String(
                    resumeSourceId
                  )
                : null,

            job_description_source_id:
              jobDescriptionSourceId
                ? String(
                    jobDescriptionSourceId
                  )
                : null,
          }),
        })
      );

    const data =
      await parseResponse(
        response
      );

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

  const response =
    await fetchAIService(
      "/transcribe",
      () => {
        const formData =
          new FormData();

        const audioBlob =
          new Blob(
            [audioBuffer],
            {
              type:
                mimeType ||
                "audio/webm",
            }
          );

        formData.append(
          "file",
          audioBlob,
          fileName ||
            "answer.webm"
        );

        return {
          method: "POST",

          body: formData,
        };
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

  const response =
    await fetchAIService(
      "/rag/index",
      () => ({
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          source_id:
            String(sourceId),

          source_type:
            sourceType,

          text: text.trim(),
        }),
      })
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

  const response =
    await fetchAIService(
      "/rag/search",
      () => ({
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          query:
            query.trim(),

          n_results:
            nResults,

          source_id:
            sourceId
              ? String(sourceId)
              : null,

          source_type:
            sourceType || null,
        }),
      })
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