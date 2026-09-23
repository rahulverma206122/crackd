import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createInterview,
  submitInterviewAnswer,
  createNextInterviewBatch,
  getResumes,
  getJobDescriptions,
  uploadResume,
  uploadJobDescription,
  transcribeInterviewAudio,
} from "../services/api";

import { useAuth } from "../context/AuthContext";

// ============================================================
// CONSTANTS
// ============================================================

const INTERVIEW_TYPES = [
  {
    value: "technical",
    label: "Technical",
    description:
      "Questions based on the technical skills in your resume and job description.",
  },
  {
    value: "project",
    label: "Project",
    description:
      "Deep-dive questions about your projects and implementation decisions.",
  },
  {
    value: "behavioral",
    label: "Behavioral",
    description:
      "Questions about your experience, responsibilities, and workplace situations.",
  },
  {
    value: "mixed",
    label: "Mixed",
    description:
      "A balanced combination of technical, project, and behavioral questions.",
  },
];

const difficultyStyles = {
  easy: "bg-green-50 text-green-700 border-green-200",
  medium: "bg-orange-50 text-orange-700 border-orange-200",
  hard: "bg-red-50 text-red-700 border-red-200",
};

// ============================================================
// HELPERS
// ============================================================

const normalizeQuestion = (question) => {
  if (!question) return null;

  return {
    ...question,
    questionType:
      question.questionType ||
      question.question_type ||
      "general",
    difficulty:
      question.difficulty ||
      "medium",
    answered: question.answered === true,
  };
};

const getDifficultyLabel = (difficulty) => {
  if (!difficulty) return "Medium";

  return (
    String(difficulty).charAt(0).toUpperCase() +
    String(difficulty).slice(1)
  );
};

const getId = (item) => item?._id || item?.id || "";

const composeAnswer = (base, finalSpeech, interim) =>
  [base, finalSpeech, interim]
    .map((part) => (part || "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");

// ============================================================
// COMPONENT
// ============================================================

export default function Interview() {
  const { token } = useAuth();

  // ============================================================
  // SETUP
  // ============================================================

  const [resumes, setResumes] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);

  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedJobDescriptionId, setSelectedJobDescriptionId] =
    useState("");

  const [interviewType, setInterviewType] = useState("mixed");

  // ============================================================
  // INTERVIEW
  // ============================================================

  const [interview, setInterview] = useState(null);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);

  // ============================================================
  // LOADING
  // ============================================================

  const [loading, setLoading] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [loadingNextBatch, setLoadingNextBatch] = useState(false);

  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingJobDescriptions, setLoadingJobDescriptions] =
    useState(true);

  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingJobDescription, setUploadingJobDescription] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // QUESTION TTS
  // ============================================================

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenQuestion, setSpokenQuestion] = useState("");

  // ============================================================
  // ANSWER SPEECH-TO-TEXT
  // ============================================================

  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micStatus, setMicStatus] = useState("");

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isListeningRef = useRef(false);

  // Browser live speech recognition. This updates the textarea
  // while the user is speaking instead of waiting for recording to stop.
  const speechRecognitionRef = useRef(null);
  const speechRecognitionSupportedRef = useRef(false);
  const voiceBaseAnswerRef = useRef("");
  const speechFinalTextRef = useRef("");
  const speechInterimTextRef = useRef("");

  // ============================================================
  // BROWSER SUPPORT
  // ============================================================

  const speechSupported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  const mediaRecorderSupported =
    typeof window !== "undefined" &&
    "MediaRecorder" in window &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  const speechRecognitionSupported =
    typeof window !== "undefined" &&
    !!(
      window.SpeechRecognition ||
      window.webkitSpeechRecognition
    );

  speechRecognitionSupportedRef.current =
    speechRecognitionSupported;

  // ============================================================
  // CURRENT QUESTION
  // ============================================================

  const currentQuestion = useMemo(() => {
    if (!interview?.questions) return null;

    return normalizeQuestion(
      interview.questions[currentQuestionIndex]
    );
  }, [interview, currentQuestionIndex]);

  const totalQuestions =
    interview?.questions?.length || 0;

  const answeredQuestions = useMemo(() => {
    if (!interview?.questions) return 0;

    return interview.questions.filter(
      (question) => question?.answered === true
    ).length;
  }, [interview]);

  const currentQuestionAnswered =
    currentQuestion?.answered === true;

  const currentDifficulty =
    currentQuestion?.difficulty || "medium";

  // ============================================================
  // LOAD DATA
  // ============================================================

  useEffect(() => {
    const loadData = async () => {
      if (!token) return;

      try {
        setLoadingResumes(true);
        setLoadingJobDescriptions(true);
        setError("");

        const [resumeResponse, jdResponse] =
          await Promise.all([
            getResumes(token),
            getJobDescriptions(token),
          ]);

        const resumeList =
          resumeResponse?.resumes ||
          resumeResponse?.data ||
          [];

        const jdList =
          jdResponse?.jobDescriptions ||
          jdResponse?.data ||
          [];

        const safeResumeList = Array.isArray(resumeList)
          ? resumeList
          : [];

        const safeJDList = Array.isArray(jdList)
          ? jdList
          : [];

        setResumes(safeResumeList);
        setJobDescriptions(safeJDList);

        if (safeResumeList.length > 0) {
          setSelectedResumeId(
            getId(safeResumeList[0])
          );
        }

        if (safeJDList.length > 0) {
          setSelectedJobDescriptionId(
            getId(safeJDList[0])
          );
        }
      } catch (err) {
        console.error(
          "Failed to load interview data:",
          err
        );

        setError(
          err?.message ||
            "Failed to load resumes and job descriptions."
        );
      } finally {
        setLoadingResumes(false);
        setLoadingJobDescriptions(false);
      }
    };

    loadData();
  }, [token]);

  // ============================================================
  // CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      if (
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }

      isListeningRef.current = false;

      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.onresult = null;
          speechRecognitionRef.current.onerror = null;
          speechRecognitionRef.current.onend = null;
          speechRecognitionRef.current.stop();
        } catch (err) {
          console.log("SpeechRecognition cleanup:", err);
        }
      }

      speechRecognitionRef.current = null;
      speechFinalTextRef.current = "";
      speechInterimTextRef.current = "";
      voiceBaseAnswerRef.current = "";

      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.ondataavailable = null;
          mediaRecorderRef.current.onstop = null;
          mediaRecorderRef.current.onerror = null;

          if (
            mediaRecorderRef.current.state !==
            "inactive"
          ) {
            mediaRecorderRef.current.stop();
          }
        } catch (err) {
          console.log(
            "MediaRecorder cleanup:",
            err
          );
        }
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
      audioChunksRef.current = [];
    };
  }, []);

  // ============================================================
  // QUESTION TTS
  // ============================================================

  const stopSpeaking = () => {
    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);

    if (currentQuestion?.question) {
      setSpokenQuestion(currentQuestion.question);
    }
  };

  const speakQuestion = () => {
    if (!currentQuestion?.question) return;

    if (!speechSupported) {
      setError(
        "Text-to-Speech is not supported in this browser."
      );
      return;
    }

    if (isListeningRef.current) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const text = currentQuestion.question;

      setSpokenQuestion("");
      setIsSpeaking(false);

      const utterance =
        new SpeechSynthesisUtterance(text);

      utterance.lang = "en-IN";
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onboundary = (event) => {
        const start = event.charIndex || 0;
        const length = event.charLength || 0;

        if (
          start >= 0 &&
          start < text.length
        ) {
          const end =
            length > 0
              ? start + length
              : start + 1;

          setSpokenQuestion(
            text.substring(
              0,
              Math.min(end, text.length)
            )
          );
        }
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpokenQuestion(text);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpokenQuestion(text);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("TTS error:", err);

      setIsSpeaking(false);
      setSpokenQuestion(
        currentQuestion.question
      );
    }
  };

  // ============================================================
  // AUTO SPEAK QUESTION
  // ============================================================

  useEffect(() => {
    if (
      !currentQuestion?.question ||
      !speechSupported
    ) {
      return;
    }

    setSpokenQuestion("");

    const timer = setTimeout(() => {
      speakQuestion();
    }, 400);

    return () => {
      clearTimeout(timer);

      if (
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }

      setIsSpeaking(false);
    };
  }, [
    currentQuestion?.question,
    speechSupported,
  ]);

  // ============================================================
  // AUDIO RECORDING + LIVE SPEECH-TO-TEXT
  // ============================================================

  const getSupportedAudioMimeType = () => {
    if (typeof MediaRecorder === "undefined") {
      return "";
    }

    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
    ];

    return (
      candidates.find((type) =>
        MediaRecorder.isTypeSupported(type)
      ) || ""
    );
  };

  const updateLiveSpeechText = () => {
    setAnswer(
      composeAnswer(
        voiceBaseAnswerRef.current,
        speechFinalTextRef.current,
        speechInterimTextRef.current
      )
    );
  };

  const startSpeechRecognition = () => {
    if (!speechRecognitionSupported) {
      return false;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      return false;
    }

    try {
      const recognition = new SpeechRecognitionAPI();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN";
      recognition.maxAlternatives = 1;

      speechRecognitionRef.current = recognition;
      speechFinalTextRef.current = "";
      speechInterimTextRef.current = "";

      recognition.onstart = () => {
        if (!isListeningRef.current) return;

        setMicStatus(
          "Listening... your words will appear live in the answer box."
        );
      };

      recognition.onresult = (event) => {
        let finalText = speechFinalTextRef.current;
        let interimText = "";

        for (
          let index = event.resultIndex;
          index < event.results.length;
          index += 1
        ) {
          const result = event.results[index];
          const transcript =
            result?.[0]?.transcript || "";

          if (result.isFinal) {
            finalText = composeAnswer(
              finalText,
              transcript,
              ""
            );
          } else {
            interimText = composeAnswer(
              interimText,
              transcript,
              ""
            );
          }
        }

        speechFinalTextRef.current = finalText;
        speechInterimTextRef.current = interimText;

        updateLiveSpeechText();
      };

      recognition.onerror = (event) => {
        console.warn(
          "SpeechRecognition error:",
          event?.error
        );

        if (
          event?.error === "not-allowed" ||
          event?.error === "service-not-allowed"
        ) {
          setMicStatus(
            "Live speech-to-text permission is unavailable. Your audio is still being recorded and will be transcribed after you stop."
          );
          return;
        }

        if (
          event?.error !== "no-speech" &&
          event?.error !== "aborted"
        ) {
          setMicStatus(
            "Live transcription paused. Your audio is still being recorded."
          );
        }
      };

      recognition.onend = () => {
        if (
          !isListeningRef.current ||
          !speechRecognitionSupportedRef.current
        ) {
          return;
        }

        // Chrome/mobile browsers can stop recognition automatically.
        // Restart it while MediaRecorder keeps recording.
        setTimeout(() => {
          if (!isListeningRef.current) return;

          try {
            recognition.start();
          } catch (err) {
            // InvalidStateError simply means recognition is already running.
            console.log(
              "SpeechRecognition restart:",
              err
            );
          }
        }, 150);
      };

      recognition.start();
      return true;
    } catch (err) {
      console.warn(
        "Live SpeechRecognition could not start:",
        err
      );

      speechRecognitionRef.current = null;
      return false;
    }
  };

  const stopSpeechRecognition = () => {
    const recognition = speechRecognitionRef.current;

    speechRecognitionRef.current = null;

    if (!recognition) return;

    try {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    } catch (err) {
      console.log(
        "SpeechRecognition stop:",
        err
      );
    }
  };

  const replaceAnswerWithFinalTranscript = (
    transcript
  ) => {
    const cleanTranscript = String(
      transcript || ""
    ).trim();

    if (cleanTranscript) {
      setAnswer(
        composeAnswer(
          voiceBaseAnswerRef.current,
          cleanTranscript,
          ""
        )
      );
      return;
    }

    // If Gemini does not return text, keep the browser's
    // live transcript instead of losing the user's answer.
    setAnswer(
      composeAnswer(
        voiceBaseAnswerRef.current,
        speechFinalTextRef.current,
        speechInterimTextRef.current
      )
    );
  };

  const startListening = async () => {
    setError("");
    setSuccess("");

    if (
      currentQuestionAnswered ||
      submittingAnswer ||
      isTranscribing
    ) {
      return;
    }

    if (!mediaRecorderSupported) {
      setError(
        "Voice recording is not supported in this browser. Please use a modern browser such as Google Chrome, Microsoft Edge, or Safari."
      );
      return;
    }

    if (isListeningRef.current) {
      return;
    }

    stopSpeaking();

    // Preserve any text that was already typed before the microphone started.
    voiceBaseAnswerRef.current = answer.trim();
    speechFinalTextRef.current = "";
    speechInterimTextRef.current = "";

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });

      const mimeType =
        getSupportedAudioMimeType();

      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
          })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      isListeningRef.current = true;

      setIsListening(true);
      setMicStatus(
        speechRecognitionSupported
          ? "Starting live transcription... speak your answer now."
          : "Recording... speak your answer now."
      );

      recorder.ondataavailable = (event) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onerror = (event) => {
        console.error(
          "MediaRecorder error:",
          event
        );

        isListeningRef.current = false;
        setIsListening(false);
        setIsTranscribing(false);
        setMicStatus("");

        stopSpeechRecognition();

        if (mediaStreamRef.current) {
          mediaStreamRef.current
            .getTracks()
            .forEach((track) => track.stop());
        }

        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];

        setError(
          "Could not record your voice. Please check your microphone and try again."
        );
      };

      recorder.onstop = async () => {
        // Stop live browser recognition first, but keep its final text in refs.
        stopSpeechRecognition();

        const chunks = [
          ...audioChunksRef.current,
        ];

        const recordedMimeType =
          recorder.mimeType ||
          mimeType ||
          "audio/webm";

        audioChunksRef.current = [];
        mediaRecorderRef.current = null;

        if (mediaStreamRef.current) {
          mediaStreamRef.current
            .getTracks()
            .forEach((track) => track.stop());
        }

        mediaStreamRef.current = null;
        isListeningRef.current = false;
        setIsListening(false);

        if (!chunks.length) {
          setMicStatus("");
          return;
        }

        const audioBlob = new Blob(
          chunks,
          {
            type: recordedMimeType,
          }
        );

        setIsTranscribing(true);
        setMicStatus(
          "Finishing AI transcription..."
        );

        try {
          const response =
            await transcribeInterviewAudio(
              audioBlob,
              token
            );

          const transcript =
            response?.text ||
            response?.transcript ||
            response?.data?.text ||
            "";

          if (String(transcript).trim()) {
            // Gemini gives the clean final transcript. Replace the live
            // browser text with it so the submitted answer is cleaner.
            replaceAnswerWithFinalTranscript(
              transcript
            );

            setMicStatus(
              "Voice answer ready. You can review it before submitting."
            );
          } else {
            replaceAnswerWithFinalTranscript("");

            if (speechFinalTextRef.current.trim()) {
              setMicStatus(
                "Live transcript kept in the answer box."
              );
            } else {
              throw new Error(
                "No speech was detected in the recording."
              );
            }
          }
        } catch (err) {
          console.error(
            "Audio transcription error:",
            err
          );

          // Do not erase the live browser transcript if AI cleanup fails.
          const fallbackAnswer = composeAnswer(
            voiceBaseAnswerRef.current,
            speechFinalTextRef.current,
            speechInterimTextRef.current
          );

          if (fallbackAnswer.trim()) {
            setAnswer(fallbackAnswer);
            setMicStatus(
              "AI cleanup failed, but your live transcript was kept."
            );
            setError(
              "AI transcription could not finish, but your live transcript is still available."
            );
          } else {
            setError(
              err?.message ||
                "Failed to transcribe your voice. Please try recording again."
            );
            setMicStatus("");
          }
        } finally {
          setIsTranscribing(false);

          // These refs are only for the current voice capture.
          voiceBaseAnswerRef.current = "";
          speechFinalTextRef.current = "";
          speechInterimTextRef.current = "";
        }
      };

      recorder.start(250);

      // Start live browser STT at the same time as MediaRecorder.
      // MediaRecorder remains the reliable audio source for Gemini fallback.
      if (!startSpeechRecognition()) {
        setMicStatus(
          "Recording... live browser transcription is unavailable; AI transcription will run when you stop."
        );
      }
    } catch (err) {
      console.error(
        "Microphone start error:",
        err
      );

      isListeningRef.current = false;
      setIsListening(false);
      setIsTranscribing(false);
      setMicStatus("");

      stopSpeechRecognition();

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];

      voiceBaseAnswerRef.current = "";
      speechFinalTextRef.current = "";
      speechInterimTextRef.current = "";

      if (
        err?.name ===
        "NotAllowedError"
      ) {
        setError(
          "Microphone permission was denied. Allow microphone access for this site in your browser and try again."
        );
      } else if (
        err?.name ===
        "NotFoundError"
      ) {
        setError(
          "No microphone was found. Connect a microphone and try again."
        );
      } else {
        setError(
          err?.message ||
            "Could not start microphone recording."
        );
      }
    }
  };

  const stopListening = () => {
    stopSpeechRecognition();

    if (!mediaRecorderRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      return;
    }

    const recorder =
      mediaRecorderRef.current;

    isListeningRef.current = false;
    setIsListening(false);
    setMicStatus(
      "Finishing recording..."
    );

    try {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    } catch (err) {
      console.error(
        "Stop recording error:",
        err
      );

      setIsTranscribing(false);
      setMicStatus("");
      setError(
        "Could not stop the microphone recording. Please try again."
      );
    }
  };

  // ============================================================
  // UPLOAD RESUME
  // ============================================================

  const handleResumeUpload = async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");
    setUploadingResume(true);

    try {
      const response =
        await uploadResume(
          file,
          token
        );

      const uploadedResume =
        response?.resume ||
        response?.data ||
        response;

      if (uploadedResume) {
        setResumes((prev) => [
          uploadedResume,
          ...prev,
        ]);

        setSelectedResumeId(
          getId(uploadedResume)
        );
      }

      setSuccess(
        "Resume uploaded successfully."
      );
    } catch (err) {
      console.error(
        "Resume upload error:",
        err
      );

      setError(
        err?.message ||
          "Failed to upload resume."
      );
    } finally {
      setUploadingResume(false);
      event.target.value = "";
    }
  };

  // ============================================================
  // UPLOAD JD
  // ============================================================

  const handleJobDescriptionUpload =
    async (event) => {
      const file =
        event.target.files?.[0];

      if (!file) return;

      setError("");
      setSuccess("");
      setUploadingJobDescription(true);

      try {
        const title =
          file.name
            .replace(/\.[^/.]+$/, "")
            .trim() ||
          "Job Description";

        const response =
          await uploadJobDescription(
            file,
            {
              title,
              company: "",
              role: "",
            },
            token
          );

        const uploadedJD =
          response?.jobDescription ||
          response?.data ||
          response;

        if (uploadedJD) {
          setJobDescriptions(
            (prev) => [
              uploadedJD,
              ...prev,
            ]
          );

          setSelectedJobDescriptionId(
            getId(uploadedJD)
          );
        }

        setSuccess(
          "Job description uploaded successfully."
        );
      } catch (err) {
        console.error(
          "JD upload error:",
          err
        );

        setError(
          err?.message ||
            "Failed to upload job description."
        );
      } finally {
        setUploadingJobDescription(false);
        event.target.value = "";
      }
    };

  // ============================================================
  // START INTERVIEW
  // ============================================================

  const handleStartInterview =
    async () => {
      setError("");
      setSuccess("");
      setLoading(true);

      stopSpeaking();

      if (isListeningRef.current) {
        stopListening();
      }

      try {
        if (!selectedResumeId) {
          throw new Error(
            "Please select a resume first."
          );
        }

        const response =
          await createInterview(
            selectedResumeId,
            selectedJobDescriptionId || null,
            interviewType,
            token
          );

        const createdInterview =
          response?.interview ||
          response?.data ||
          response;

        if (!createdInterview) {
          throw new Error(
            "Interview could not be created."
          );
        }

        const normalizedInterview = {
          ...createdInterview,
          questions:
            Array.isArray(
              createdInterview.questions
            )
              ? createdInterview.questions.map(
                  normalizeQuestion
                )
              : [],
        };

        setInterview(
          normalizedInterview
        );

        setCurrentQuestionIndex(0);
        setAnswer("");
        voiceBaseAnswerRef.current = "";
        speechFinalTextRef.current = "";
        speechInterimTextRef.current = "";
        setEvaluation(null);
        setSpokenQuestion("");

        setSuccess(
          "Interview started. Good luck!"
        );
      } catch (err) {
        console.error(
          "Start interview error:",
          err
        );

        setError(
          err?.message ||
            "Failed to start interview."
        );
      } finally {
        setLoading(false);
      }
    };

  // ============================================================
  // SUBMIT ANSWER
  // ============================================================

  const handleSubmitAnswer =
    async () => {
      if (!interview) return;

      const current =
        interview.questions?.[
          currentQuestionIndex
        ];

      if (!current) return;

      if (
        isListeningRef.current ||
        isTranscribing
      ) {
        return;
      }

      const finalAnswer =
        answer.trim();

      if (!finalAnswer) {
        setError(
          "Please write or speak your answer first."
        );
        return;
      }

      setError("");
      setSuccess("");
      setSubmittingAnswer(true);

      stopSpeaking();

      try {
        const response =
          await submitInterviewAnswer(
            interview._id ||
              interview.id,
            finalAnswer,
            token
          );

        const result =
          response?.evaluation ||
          response?.result ||
          response?.data ||
          response;

        setEvaluation(result);

        if (response?.interview) {
          const updatedQuestions =
            Array.isArray(
              response.interview.questions
            )
              ? response.interview.questions.map(
                  normalizeQuestion
                )
              : [];

          setInterview({
            ...response.interview,
            questions:
              updatedQuestions,
          });
        } else {
          setInterview((prev) => {
            if (!prev) return prev;

            const questions = [
              ...(prev.questions || []),
            ];

            const existing =
              questions[
                currentQuestionIndex
              ];

            if (existing) {
              questions[
                currentQuestionIndex
              ] = {
                ...existing,
                answer: finalAnswer,
                answered: true,
                evaluation: result,
              };
            }

            return {
              ...prev,
              questions,
            };
          });
        }

        setAnswer("");
      } catch (err) {
        console.error(
          "Submit answer error:",
          err
        );

        setError(
          err?.message ||
            "Failed to evaluate your answer."
        );
      } finally {
        setSubmittingAnswer(false);
      }
    };

  // ============================================================
  // NEXT QUESTION
  // ============================================================

  const handleNextQuestion = () => {
    stopSpeaking();

    if (isListeningRef.current) {
      stopListening();
    }

    setEvaluation(null);
    setAnswer("");
    voiceBaseAnswerRef.current = "";
    speechFinalTextRef.current = "";
    speechInterimTextRef.current = "";
    setError("");
    setSuccess("");
    setSpokenQuestion("");

    if (
      interview &&
      currentQuestionIndex <
        interview.questions.length - 1
    ) {
      setCurrentQuestionIndex(
        (prev) => prev + 1
      );
    }
  };

  // ============================================================
  // NEXT BATCH
  // ============================================================

  const handleNextBatch =
    async () => {
      if (!interview) return;

      stopSpeaking();

      if (isListeningRef.current) {
        stopListening();
      }

      setError("");
      setSuccess("");
      setLoadingNextBatch(true);

      try {
        const response =
          await createNextInterviewBatch(
            interview._id ||
              interview.id,
            token
          );

        const updatedInterview =
          response?.interview;

        if (!updatedInterview) {
          throw new Error(
            "No updated interview was returned."
          );
        }

        const normalizedInterview = {
          ...updatedInterview,
          questions:
            Array.isArray(
              updatedInterview.questions
            )
              ? updatedInterview.questions.map(
                  normalizeQuestion
                )
              : [],
        };

        setInterview(
          normalizedInterview
        );

        const firstUnanswered =
          normalizedInterview.questions.findIndex(
            (question) =>
              question.answered !== true
          );

        if (firstUnanswered >= 0) {
          setCurrentQuestionIndex(
            firstUnanswered
          );
        } else {
          setCurrentQuestionIndex(
            Math.max(
              0,
              normalizedInterview.questions
                .length - 10
            )
          );
        }

        setAnswer("");
        voiceBaseAnswerRef.current = "";
        speechFinalTextRef.current = "";
        speechInterimTextRef.current = "";
        setEvaluation(null);
        setSpokenQuestion("");

        setSuccess(
          "Next 10 interview questions are ready."
        );
      } catch (err) {
        console.error(
          "Generate next batch error:",
          err
        );

        setError(
          err?.message ||
            "Failed to generate the next question batch."
        );
      } finally {
        setLoadingNextBatch(false);
      }
    };

  // ============================================================
  // SETUP SCREEN
  // ============================================================

  if (!interview) {
    return (
      <div className="min-h-screen bg-orange-50/30 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-7">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-orange-600">
              AI Interview
            </p>

            <h1 className="text-3xl font-bold text-gray-900">
              Practice Interview
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Practice realistic interview
              questions based on your resume
              and target job description.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            {/* RESUME */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Select Resume
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Choose the resume for this
                interview.
              </p>

              <select
                value={selectedResumeId}
                onChange={(e) =>
                  setSelectedResumeId(
                    e.target.value
                  )
                }
                disabled={loadingResumes}
                className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">
                  {loadingResumes
                    ? "Loading resumes..."
                    : "Select a resume"}
                </option>

                {resumes.map((resume) => (
                  <option
                    key={getId(resume)}
                    value={getId(resume)}
                  >
                    {resume.title ||
                      resume.fileName ||
                      resume.originalName ||
                      "Resume"}
                  </option>
                ))}
              </select>

              <div className="mt-4">
                <label className="inline-flex cursor-pointer items-center rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-700 hover:bg-orange-100">
                  {uploadingResume
                    ? "Uploading..."
                    : "Upload New Resume"}

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={
                      handleResumeUpload
                    }
                    disabled={
                      uploadingResume
                    }
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* JD */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Select Job Description
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Optional job description for
                targeted questions.
              </p>

              <select
                value={
                  selectedJobDescriptionId
                }
                onChange={(e) =>
                  setSelectedJobDescriptionId(
                    e.target.value
                  )
                }
                disabled={
                  loadingJobDescriptions
                }
                className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">
                  {loadingJobDescriptions
                    ? "Loading job descriptions..."
                    : "No job description (optional)"}
                </option>

                {jobDescriptions.map((jd) => (
                  <option
                    key={getId(jd)}
                    value={getId(jd)}
                  >
                    {jd.title ||
                      jd.jobTitle ||
                      jd.fileName ||
                      "Job Description"}
                  </option>
                ))}
              </select>

              <div className="mt-4">
                <label className="inline-flex cursor-pointer items-center rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-700 hover:bg-orange-100">
                  {uploadingJobDescription
                    ? "Uploading..."
                    : "Upload New JD"}

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={
                      handleJobDescriptionUpload
                    }
                    disabled={
                      uploadingJobDescription
                    }
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* INTERVIEW TYPE */}
          <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Interview Type
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select the type of interview
              you want to practice.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {INTERVIEW_TYPES.map((type) => {
                const selected =
                  interviewType ===
                  type.value;

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setInterviewType(
                        type.value
                      )
                    }
                    className={`rounded-xl border p-3.5 text-left transition ${
                      selected
                        ? "border-orange-500 bg-orange-50 ring-2 ring-orange-100"
                        : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">
                        {type.label}
                      </span>

                      {selected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                          ✓
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 text-xs leading-5 text-gray-500">
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={
                handleStartInterview
              }
              disabled={
                loading ||
                !selectedResumeId
              }
              className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Preparing Interview..."
                : "Start Interview"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // INTERVIEW SCREEN
  // ============================================================

  return (
    <div className="min-h-screen bg-orange-50/30 px-4 py-6">
      <div className="mx-auto max-w-4xl">
        {/* HEADER */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
              AI Interview
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              {
                INTERVIEW_TYPES.find(
                  (type) =>
                    type.value ===
                    interviewType
                )?.label ||
                  "Interview"
              }
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Question{" "}
              {currentQuestionIndex + 1}{" "}
              of {totalQuestions}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <span className="text-gray-500">
                Answered
              </span>{" "}
              <span className="font-semibold text-gray-900">
                {answeredQuestions}/
                {Math.min(
                  totalQuestions,
                  10
                )}
              </span>
            </div>

            <div className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm">
              <span className="text-orange-600">
                Round
              </span>{" "}
              <span className="font-semibold text-orange-700">
                {Math.floor(
                  currentQuestionIndex /
                    10
                ) + 1}
              </span>
            </div>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-300"
            style={{
              width: `${
                totalQuestions > 0
                  ? ((currentQuestionIndex + 1) /
                      totalQuestions) *
                    100
                  : 0
              }%`,
            }}
          />
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {currentQuestion ? (
          <div className="space-y-5">
            {/* QUESTION CARD */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              {/* TYPE + DIFFICULTY */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
                  {currentQuestion.questionType ||
                    "General"}
                </span>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    difficultyStyles[
                      currentDifficulty
                    ] ||
                    difficultyStyles.medium
                  }`}
                >
                  {getDifficultyLabel(
                    currentDifficulty
                  )}
                </span>
              </div>

              {/* AI AVATAR */}
              <div className="mb-5 flex justify-center">
                <div
                  className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isSpeaking
                      ? "border-orange-500 bg-orange-50 shadow-md shadow-orange-100"
                      : "border-orange-200 bg-orange-50"
                  }`}
                >
                  <span className="text-4xl">
                    👩🏻‍💻
                  </span>

                  {isSpeaking && (
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    </span>
                  )}
                </div>
              </div>

              {/* QUESTION */}
              <div className="mb-5">
                <p className="text-center text-sm font-medium text-gray-500">
                  Question{" "}
                  {currentQuestionIndex + 1}
                </p>

                <div className="mt-2 min-h-[78px]">
                  <h2 className="text-center text-xl font-semibold leading-8 text-gray-900">
                    {spokenQuestion ||
                      (!isSpeaking
                        ? currentQuestion.question
                        : "")}

                    {isSpeaking && (
                      <span className="ml-1 inline-block h-5 w-0.5 animate-pulse bg-orange-500 align-middle" />
                    )}
                  </h2>
                </div>
              </div>

              {/* TTS BUTTON */}
              <div className="mb-5 flex justify-center">
                {!isSpeaking ? (
                  <button
                    type="button"
                    onClick={
                      speakQuestion
                    }
                    disabled={
                      !speechSupported
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    🔊 Read Question Aloud
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={
                      stopSpeaking
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    ⏹ Stop Speaking
                  </button>
                )}
              </div>

              {/* ANSWER */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-800">
                    Your Answer
                  </label>

                  {isListening && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      Listening...
                    </span>
                  )}
                </div>

                <textarea
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                  }}
                  disabled={
                    submittingAnswer ||
                    currentQuestionAnswered ||
                    isListening
                  }
                  placeholder="Type your answer or use the microphone..."
                  rows={6}
                  className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
                />

                {isTranscribing && (
                  <div className="mt-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                    <span className="font-medium">
                      AI transcription:
                    </span>{" "}
                    Processing your voice answer...
                  </div>
                )}

                {/* CONTROLS */}
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {!isListening ? (
                      <button
                        type="button"
                        onClick={
                          startListening
                        }
                        disabled={
                          !mediaRecorderSupported ||
                          submittingAnswer ||
                          currentQuestionAnswered ||
                          isTranscribing
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        🎤 Speak Answer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={
                          stopListening
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        ⏹ Stop Recording
                      </button>
                    )}
                  </div>

                  {!currentQuestionAnswered && (
                    <button
                      type="button"
                      onClick={
                        handleSubmitAnswer
                      }
                      disabled={
                        submittingAnswer ||
                        isListening ||
                        isTranscribing ||
                        !answer.trim()
                      }
                      className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submittingAnswer
                        ? "Evaluating..."
                        : "Submit Answer"}
                    </button>
                  )}
                </div>

                {micStatus && (
                  <p className="mt-2 text-xs text-gray-500">
                    {micStatus}
                  </p>
                )}

                {!mediaRecorderSupported && (
                  <p className="mt-2 text-xs text-gray-500">
                    Voice answers require a browser with microphone recording support.
                  </p>
                )}
              </div>
            </div>

            {/* EVALUATION */}
            {evaluation && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                      AI Evaluation
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-gray-900">
                      Your Answer Result
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-gray-500">
                        Score
                      </p>

                      <p className="text-lg font-bold text-gray-900">
                        {evaluation.score ??
                          evaluation.totalScore ??
                          0}
                        /10
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-gray-500">
                        Match
                      </p>

                      <p className="text-lg font-bold text-gray-900">
                        {evaluation.answerMatchPercentage ??
                          evaluation.answer_match_percentage ??
                          evaluation.answerMatch ??
                          0}
                        %
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <p className="mb-1 text-sm font-semibold text-orange-700">
                    Correct Answer
                  </p>

                  <p className="line-clamp-3 text-sm leading-6 text-gray-700">
                    {evaluation.correctAnswer ||
                      evaluation.correct_answer ||
                      "No reference answer available."}
                  </p>
                </div>
              </div>
            )}

            {/* NAVIGATION */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {currentQuestionIndex <
                    totalQuestions - 1
                      ? "Continue Interview"
                      : "Round Complete"}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {currentQuestionIndex <
                    totalQuestions - 1
                      ? "Move to the next question when you're ready."
                      : "Generate another batch to continue the interview."}
                  </p>
                </div>

                {currentQuestionIndex <
                totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={
                      handleNextQuestion
                    }
                    disabled={
                      !currentQuestionAnswered
                    }
                    className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next Question →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={
                      handleNextBatch
                    }
                    disabled={
                      loadingNextBatch ||
                      !currentQuestionAnswered
                    }
                    className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingNextBatch
                      ? "Generating..."
                      : "Generate Next 10 Questions →"}
                  </button>
                )}
              </div>
            </div>

            {/* ROUND COMPLETE */}
            {currentQuestionIndex ===
              totalQuestions - 1 &&
              currentQuestionAnswered && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                      ✓
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-green-900">
                        Current round completed
                      </h3>

                      <p className="mt-1 text-sm text-green-700">
                        Generate another batch
                        of adaptive questions
                        based on your performance.
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-orange-200 bg-orange-50 text-3xl">
              👩🏻‍💻
            </div>

            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              No question available
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Please try generating the
              interview questions again.
            </p>

            <button
              type="button"
              onClick={
                handleNextBatch
              }
              disabled={
                loadingNextBatch
              }
              className="mt-5 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loadingNextBatch
                ? "Generating..."
                : "Generate Questions"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}