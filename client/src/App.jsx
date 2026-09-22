import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Resumes from "./pages/Resumes";
import ResumeDetails from "./pages/ResumeDetails";
import JobDescriptions from "./pages/JobDescriptions";
import JobDescriptionDetails from "./pages/JobDescriptionDetails";
import Analysis from "./pages/Analysis";
import ResumeOptimization from "./pages/ResumeOptimization";
import Interview from "./pages/Interview";
import InterviewHistory from "./pages/InterviewHistory";
import InterviewDetails from "./pages/InterviewDetails";
import Progress from "./pages/Progress";
import JobApplications from "./pages/JobApplications";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* ================================================== */}
      {/* AUTH */}
      {/* ================================================== */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* ================================================== */}
      {/* DASHBOARD */}
      {/* ================================================== */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* ================================================== */}
      {/* JOB APPLICATIONS */}
      {/* ================================================== */}

      <Route
        path="/job-applications"
        element={
          <ProtectedRoute>
            <JobApplications />
          </ProtectedRoute>
        }
      />

      {/* ================================================== */}
      {/* RESUME OPTIMIZATION */}
      {/* ================================================== */}

      <Route
        path="/resume-optimization"
        element={
          <ProtectedRoute>
            <ResumeOptimization />
          </ProtectedRoute>
        }
      />

      {/* ================================================== */}
      {/* INTERVIEW */}
      {/* ================================================== */}

      <Route
        path="/interview"
        element={
          <ProtectedRoute>
            <Interview />
          </ProtectedRoute>
        }
      />

      {/* ================================================== */}
      {/* INTERVIEW HISTORY */}
      {/* ================================================== */}

      <Route
        path="/interview-history"
        element={
          <ProtectedRoute>
            <InterviewHistory />
          </ProtectedRoute>
        }
      />

      {/* ================================================== */}
      {/* INTERVIEW DETAILS */}
      {/* ================================================== */}

      <Route
        path="/interviews/:interviewId"
        element={
          <ProtectedRoute>
            <InterviewDetails />
          </ProtectedRoute>
        }
      />

      {/* ================================================== */}
      {/* ANALYSIS */}
      {/* ================================================== */}

      <Route
        path="/analysis"
        element={
          <ProtectedRoute>
            <Analysis />
          </ProtectedRoute>
        }
      />

      {/* ================================================== */}
      {/* RESUMES */}
      {/* ================================================== */}

      <Route
        path="/resumes"
        element={
          <ProtectedRoute>
            <Resumes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resumes/:id"
        element={
          <ProtectedRoute>
            <ResumeDetails />
          </ProtectedRoute>
        }
      />

      {/* ================================================== */}
      {/* JOB DESCRIPTIONS */}
      {/* ================================================== */}

      <Route
        path="/job-descriptions"
        element={
          <ProtectedRoute>
            <JobDescriptions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/job-descriptions/:id"
        element={
          <ProtectedRoute>
            <JobDescriptionDetails />
          </ProtectedRoute>
        }
      />

      {/* ================================================== */}
      {/* PROGRESS */}
      {/* ================================================== */}

      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <Progress />
          </ProtectedRoute>
        }
      />

      {/* ================================================== */}
      {/* DEFAULT */}
      {/* ================================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;