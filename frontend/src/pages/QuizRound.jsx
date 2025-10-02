import axios from "axios";
import { useRef, useEffect, useState, useCallback } from "react";
import sendProgressEmail from "../components/NextroundEmail";
import sendRejectionEmail from "../components/RejectionEmail";
import sendCheatEmail from "../components/CheatingEmail";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Bell,
  ChevronDown,
  Download,
  Mail,
  Settings,
  User,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "../index.css";
import * as faceapi from "face-api.js";

let currentPage = "entrance";

const QuizComponent = () => {
  const [userid, setuserid] = useState("");
  const [email, setemail] = useState("");
  const [name, setName] = useState("");
  const [jobrole, setJobrole] = useState("");
  const [hremail, setHremail] = useState("");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [existingQuizzes, setExistingQuizzes] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [companyName, setCompanyName] = useState(
    localStorage.getItem("companyName") || ""
  );
  const [candidatesEmail, setCandidatesEmails] = useState([]);
  const [showInstructionsModal, setShowInstructionsModal] = useState(true);

  // New state for one-question-at-a-time functionality
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(60); // 60 seconds per question
  const [isQuestionTimerActive, setIsQuestionTimerActive] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [questionStartTimeMs, setQuestionStartTimeMs] = useState(null);
  const [attemptedQuestionsMetrics, setAttemptedQuestionsMetrics] = useState([]);

  const videoRef = useRef();
  const canvasRef = useRef();
  const [screenshot, setScreenshot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cheatComment, setCheatComment] = useState("");
  const [aptitudeTiming, setAptitudeTiming] = useState(30);

  // New state for timer
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showCheatingModal, setShowCheatingModal] = useState(false);
  
  // New state for looking away detection
  const [lookAwayCount, setLookAwayCount] = useState(0);
  const [showLookAwayWarning, setShowLookAwayWarning] = useState(false);
  const [lastLookAwayTime, setLastLookAwayTime] = useState(0);
  
  // New state for test completion
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);

  const cheatingDetecedByUser = async () => {
    try {
      console.log("Cheating detected by user");
      console.log("user: ", userid);
      console.log("cheatComment: ", cheatComment);

      const response = await axios.post(`${BACKEND_URL}/cheatingDetected`, {
        userId: userid,
        email: email,
        comment: cheatComment || "No comment provided",
        cheatImage: "image 1", // Replace with actual image data if available
      });

      console.log("Cheating response: ", response.data);
      // Also send email via EmailJS
      try {
        await sendCheatEmail({
          user_id: userid,
          candidate_name: name,
          to_email: email,
          round_name: "Aptitude Round",
          reason: cheatComment || "Proctoring alert",
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.error("Failed to send cheat email via EmailJS:", e);
      }
      // Optional: Reload the page to reflect updates
      // window.location.reload(true);
    } catch (error) {
      console.error("Error sending cheating email:", error);
    }
  };

  const detectionIntervalRef = useRef(null);

  useEffect(() => {
    // Function to handle visibility change

    const handleVisibilityChange = () => {
      if (document.hidden && currentPage === "main") {
        console.log(
          "User has switched to another tab or minimized the browser."
        );
        setShowCheatingModal(true);
      }
    };

    // Add the event listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up the event listener on component unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    startVideo();
    loadModels();
  }, []);

  // Check if test is already completed when component loads
  useEffect(() => {
    const checkTestCompletion = async () => {
      if (userid && email) {
        try {
          const response = await axios.get(`${BACKEND_URL}/getUserInfo/${userid}`);
          const userData = response.data;
          
          // Check if this specific candidate email has already completed the test
          const hasPassed = userData.aptitudePassesCandidates?.includes(email) || false;
          const hasFailed = userData.aptitudeFailedCandidates?.includes(email) || false;
          
          if (hasPassed || hasFailed) {
            setTestCompleted(true);
          }
        } catch (error) {
          console.error("Error checking test completion:", error);
        }
      }
    };

    checkTestCompletion();
  }, [userid, email]);

  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current)
        clearInterval(detectionIntervalRef.current);
    };
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((currentStream) => {
        videoRef.current.srcObject = currentStream;
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const loadModels = () => {
    Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri("/models")]).then(
      () => {
        detectFullBody();
      }
    );
  };

  const takeScreenshot = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  };

  const detectFullBody = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const updateDetections = async () => {
      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 512,
          scoreThreshold: 0.5,
        })
      );

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight,
      };
      faceapi.matchDimensions(canvas, displaySize);

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      resizedDetections.forEach((detection) => {
        const { x, y, width, height } = detection.box;

        // Calculate body shape dimensions
        const bodyWidth = width * 1.5; // Make the body wider than the face
        const bodyHeight = height * 2.5; // Extend downward to simulate body
        const bodyX = x - (bodyWidth - width) / 2; // Center the body horizontally
        const bodyY = y + height; // Position the body below the face

        // Draw face circle
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = Math.max(width, height) / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw body rectangle
        ctx.beginPath();
        ctx.rect(bodyX, bodyY, bodyWidth, bodyHeight);
        ctx.strokeStyle = "blue"; // Different color for body shape
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Multiple people detection
      if (detections.length >= 2 && !isModalOpen) {
        const screenshotData = takeScreenshot();
        setScreenshot(screenshotData);
        setIsModalOpen(true);
      }

      // Looking away detection (no face detected)
      if (detections.length === 0 && currentPage === "main") {
        const currentTime = Date.now();
        const timeSinceLastLookAway = currentTime - lastLookAwayTime;
        
        // Only count as look away if more than 2 seconds have passed since last detection
        if (timeSinceLastLookAway > 2000) {
          setLookAwayCount(prev => {
            const newCount = prev + 1;
            // Show warning after 3 look aways
            if (newCount >= 3 && !showLookAwayWarning) {
              setShowLookAwayWarning(true);
              setTimeout(() => {
                setShowLookAwayWarning(false);
              }, 5000); // Hide warning after 5 seconds
            }
            return newCount;
          });
          setLastLookAwayTime(currentTime);
        }
      } else if (detections.length > 0) {
        // Reset look away count when face is detected
        setLookAwayCount(0);
      }
    };

    video.addEventListener("play", () => {
      if (detectionIntervalRef.current)
        clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = setInterval(updateDetections, 1000);
    });
  };

  const handleManualTrigger = () => {
    const screenshotData = takeScreenshot();
    setScreenshot(screenshotData);
    setIsModalOpen(true);
  };

  const handleCheatModalSubmit = () => {
    console.log("Cheat Comment:", cheatComment);
    setCheatComment("");
    setIsModalOpen(false);
    cheatingDetecedByUser();
  };

  // Start timer when quiz begins
  const startTimer = (minutes) => {
    setTimeRemaining(minutes * 60); // Convert minutes to seconds
    setIsTimerActive(true);
    currentPage = "main";
  };

  // Start question timer
  const startQuestionTimer = () => {
    setQuestionTimer(60); // Reset to 60 seconds
    setIsQuestionTimerActive(true);
    setQuestionStartTimeMs(Date.now());
  };

  // Timer effect to countdown and auto-submit when time is up
  useEffect(() => {
    let interval = null;
    if (isTimerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isTimerActive && timeRemaining === 0) {
      // Time is up, automatically submit the quiz
      clearInterval(interval);
      handleQuizSubmit();
    }

    return () => clearInterval(interval);
  }, [isTimerActive, timeRemaining]);

  // Question timer effect
  useEffect(() => {
    let interval = null;
    if (isQuestionTimerActive && questionTimer > 0) {
      interval = setInterval(() => {
        setQuestionTimer((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isQuestionTimerActive && questionTimer === 0) {
      // Question time is up, move to next question
      clearInterval(interval);
      // Move to next question or submit
      if (currentQuestionIndex < existingQuizzes.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setIsQuestionTimerActive(false);
      } else {
        // Last question, submit the quiz
        handleQuizSubmit();
      }
    }

    return () => clearInterval(interval);
  }, [isQuestionTimerActive, questionTimer, currentQuestionIndex, existingQuizzes.length]);

  // Start question timer when current question changes
  useEffect(() => {
    if (submitted && existingQuizzes.length > 0) {
      startQuestionTimer();
    }
  }, [currentQuestionIndex, submitted]);

  // Format time remaining as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Define handleQuizSubmit early to avoid dependency issues
  const handleQuizSubmit = useCallback(async () => {
    const userId = userid;
    const userEmail = email;
    setemail(email);

    if (!userEmail) {
      setError("Email is required to send the rejection email.");
      return;
    }

    // Calculate score only on submit
    const score = calculateScore();
    setScore(score);

    try {
      const response = await axios.get(`${BACKEND_URL}/getUserInfo/${userId}`);
      const user = response.data;
      const passingMarks = user.aptitudePassingMarks;

      console.log(
        `User's passing marks: ${passingMarks}, Your score: ${score}`
      );

      await axios.post(`${BACKEND_URL}/updateUser`, {
        userId,
        userEmail,
        score,
      });

      // Track ML performance for this attempt
      try {
        const attemptPayload = {
          ownerUserId: userId,
          candidateEmail: userEmail,
          candidateName: name,
          attempt: {
            attemptId: `${userEmail}-${Date.now()}`,
            testType: "aptitude",
            startTime: new Date(Date.now() - timeRemaining * 1000),
            endTime: new Date(),
            totalTimeSeconds:
              (aptitudeTiming ? parseInt(aptitudeTiming) * 60 : 0) - timeRemaining,
            score: score,
            maxScore: existingQuizzes.length,
            questions: attemptedQuestionsMetrics.map((m, idx) => ({
              questionId: String(idx),
              questionType: m.questionType,
              complexity: m.complexity,
              timeSpentSeconds: m.timeSpentSeconds,
              attempts: m.attempts,
              isCorrect: m.isCorrect,
              errors: [],
            })),
            cheatingIncidents:
              lookAwayCount > 0
                ? [
                    {
                      type: "look_away",
                      count: lookAwayCount,
                      severity: Math.min(10, lookAwayCount),
                    },
                  ]
                : [],
            performanceMetrics: {},
          },
        };
        await axios.post(`${BACKEND_URL}/trackQuizPerformance`, attemptPayload);
      } catch (mlErr) {
        console.error("Failed to track quiz performance:", mlErr);
      }

      if (score >= passingMarks) {
        const templateParams = {
          user_id: userId,
          subject: "Congratulations! You're Invited to the Technical Round",
          candidate_name: name,
          hr_email: hremail,
          roundName: "Technical Round",
          tech_link: `${FRONTEND_URL}/techRound`,
          company_name: companyName,
          to_email: userEmail,
          recipient_address: email,
        };

        try {
          await sendProgressEmail(templateParams);
          console.log("Email sent successfully!");
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }
      } else {
        const templateParams = {
          job_role: jobrole,
          candidate_name: name,
          round_name: "Aptitude Round",
          company_name: companyName,
          to_email: userEmail,
        };

        try {
          await sendRejectionEmail(templateParams);
          console.log("Email sent successfully!");
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }
      }

      console.log(`Quiz completed! Your score: ${score}`);
      
      // Show completion modal instead of alert
      setShowCompletionModal(true);
      setTestCompleted(true);
      setSubmitted(false);
      
      // Close browser tab after 5 seconds
      setTimeout(() => {
        window.close();
        // Fallback if window.close() doesn't work
        window.location.href = 'about:blank';
      }, 5000);
      
    } catch (error) {
      console.error("Error submitting quiz:", error);
    }
  }, [userid, email, name, hremail, companyName, candidatesEmail, existingQuizzes, selectedAnswers]);

  // Define calculateScore function
  const calculateScore = () => {
    let score = 0;
    existingQuizzes.forEach((quiz, idx) => {
      if (selectedAnswers[idx] === quiz.ans) score += 1;
    });
    return score;
  };

  const fetchUserInfo = async () => {
    try {
      const userId = userid;
      if (!userId) {
        console.error("No userId found in localStorage.");
        setError("User ID is required. Please enter a valid User ID.");
        return;
      }

      console.log("Fetching user info for userId:", userId);
      const response = await axios.get(`${BACKEND_URL}/getUserInfo/${userId}`);
      console.log("Dashboard data:", response.data);
      setJobrole(response.data.jobRole);
      setHremail(response.data.email);
      setAptitudeTiming(response.data.aptitudeTime);
      setCandidatesEmails(response.data.candidateData);

      const emails =
        response.data.candidateData?.map((candidate) => candidate.email) || [];
      setCandidatesEmails(emails);
    } catch (error) {
      console.error("Error fetching user info:", error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 400) {
          setError(
            "Invalid User ID format. Please check your User ID and try again."
          );
        } else if (error.response.status === 404) {
          setError("User not found. Please check your User ID and try again.");
        } else {
          setError(
            `Server error: ${
              error.response.data?.message || error.response.statusText
            }`
          );
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError(
          "No response from server. Please check your connection and try again."
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        setError("An error occurred while setting up the request.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear any previous errors
    setError(null);

    // Validate required fields
    if (!userid.trim()) {
      setError("User ID is required.");
      return;
    }

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    await fetchUserInfo();

    setScore(0); // Reset score before starting the quiz

    const candidateData = candidatesEmail;

    const candidateExists = candidateData.some(
      (candidate) => candidate === email
    );

    // Check if candidate has already taken the test
    try {
      const checkResponse = await axios.get(`${BACKEND_URL}/getUserInfo/${userid}`);
      const userData = checkResponse.data;
      
      // Check if this specific candidate email has already completed the test
      const hasPassed = userData.aptitudePassesCandidates?.includes(email) || false;
      const hasFailed = userData.aptitudeFailedCandidates?.includes(email) || false;
      
      if (hasPassed || hasFailed) {
        setError("You have already completed the aptitude test with this email. Each candidate can only take the test once.");
        return;
      }
    } catch (checkError) {
      console.error("Error checking candidate test status:", checkError);
    }

    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/getQuiz`, {
        params: { userId: userid },
      });
      console.log("Quiz Responses : ", response);
      setExistingQuizzes(response.data);
      setSubmitted(true);
      setLoading(false);

      // Start timer when quiz begins
      if (aptitudeTiming) {
        startTimer(parseInt(aptitudeTiming));
      }
    } catch (err) {
      console.error("Error fetching quiz:", err);
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (err.response.status === 400) {
          setError(
            "Invalid User ID format. Please check your User ID and try again."
          );
        } else if (err.response.status === 404) {
          setError("User not found. Please check your User ID and try again.");
        } else {
          setError(
            `Server error: ${
              err.response.data?.message || err.response.statusText
            }`
          );
        }
      } else if (err.request) {
        // The request was made but no response was received
        setError(
          "No response from server. Please check your connection and try again."
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        setError("An error occurred while setting up the request.");
      }
      setLoading(false);
    }
  };

  const handleAnswerSelect = (quizId, selectedOption) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [quizId]: selectedOption,
    }));
    // Mark this question as answered
    setAnsweredQuestions((prev) => new Set([...prev, quizId]));
    const endTime = Date.now();
    const timeSpentSec = questionStartTimeMs
      ? Math.max(0, Math.round((endTime - questionStartTimeMs) / 1000))
      : 0;
    setAttemptedQuestionsMetrics((prev) => {
      const existingIdx = prev.findIndex((m) => m.localIndex === quizId);
      const metric = {
        localIndex: quizId,
        questionType: "mcq",
        complexity: "unknown",
        timeSpentSeconds: timeSpentSec,
        attempts: 1,
        isCorrect: existingQuizzes?.[quizId]?.ans === selectedOption,
      };
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = metric;
        return copy;
      }
      return [...prev, metric];
    });
  };

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < existingQuizzes.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setIsQuestionTimerActive(false); // Stop current timer
      setQuestionStartTimeMs(Date.now());
    } else {
      // Last question, submit the quiz
      handleQuizSubmit();
    }
  }, [currentQuestionIndex, existingQuizzes.length, handleQuizSubmit]);

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setIsQuestionTimerActive(false); // Stop current timer
    }
  };

  const handleSkipQuestion = () => {
    handleNextQuestion();
  };

  const renderUserDetailsForm = () => (
    <div className="min-h-screen flex items-start justify-center bg-[#0D0D0D] pt-20 pb-10 px-4 overflow-hidden">
      <div className="w-full max-w-md bg-[#1A1A1A] rounded-xl border border-[#333333] overflow-hidden relative shadow-2xl">
        {/* Glowing accent elements */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00BFFF] to-[#1E90FF]"></div>
        <div className="absolute top-10 right-10 w-4 h-4 rounded-full bg-[#00FF99] shadow-[0_0_15px_#00FF99]"></div>
        <div className="absolute bottom-20 left-1/4 w-4 h-4 rounded-full bg-[#B266FF] shadow-[0_0_15px_#B266FF]"></div>

        {/* Header */}
        <div className="bg-[#1A1A1A] border-b border-[#333333] px-6 py-4">
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00BFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_8px_#00BFFF]"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <path d="M5 10v4h14v-4" />
              <line x1="8" y1="10" x2="8" y2="14" />
              <line x1="12" y1="10" x2="12" y2="14" />
              <line x1="16" y1="10" x2="16" y2="14" />
            </svg>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00BFFF] to-[#1E90FF]">
              Aptitude Test
            </span>
          </h1>
          <p className="text-sm text-center text-gray-400 mt-1">
            Please enter your details to start the aptitude test
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="text-red-400 mr-3" size={20} />
                <span className="text-red-300">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#00BFFF]">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#222222] border border-[#333333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BFFF] focus:border-transparent"
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* User ID Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#00FF99]">
                User ID
              </label>
              <input
                type="text"
                placeholder="Recruiter ID"
                value={userid}
                onChange={(e) => setuserid(e.target.value)}
                className="w-full px-4 py-3 bg-[#222222] border border-[#333333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00FF99] focus:border-transparent"
              />
              {errors.userid && (
                <p className="text-red-400 text-sm mt-1">{errors.userid}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#B266FF]">
                Email Address
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setemail(e.target.value)}
                className="w-full px-4 py-3 bg-[#222222] border border-[#333333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#B266FF] focus:border-transparent"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-lg font-bold text-white transition-all duration-300 flex items-center justify-center"
              style={{
                background: "linear-gradient(to right, #00BFFF, #1E90FF)",
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Starting Quiz...
                </div>
              ) : (
                "Start Aptitude Test"
              )}
            </button>
          </form>
        </div>

        {/* Footer Glow */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#00BFFF] via-[#B266FF] to-[#FF7F50]"></div>
      </div>
    </div>
  );

  const InstructionsModal = () => (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative bg-black border border-cyan-500/30 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-t-2xl"></div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full mb-3">
            <AlertTriangle className="text-red-200" size={24} />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Important Instructions
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mx-auto mt-2"></div>
        </div>

        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          <div className="flex items-start space-x-3 p-3 bg-gray-750 rounded-lg">
            <div className="bg-cyan-500/20 p-1.5 rounded-full mt-0.5">
              <User className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-gray-300 text-sm">
              Camera will be ON and monitoring you throughout the quiz
            </p>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-gray-750 rounded-lg">
            <div className="bg-red-500/20 p-1.5 rounded-full mt-0.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-gray-300 text-sm">
              More than one person detected will lead to immediate rejection
            </p>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-gray-750 rounded-lg">
            <div className="bg-orange-500/20 p-1.5 rounded-full mt-0.5">
              <X className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-gray-300 text-sm">
              Minimizing screen or switching tabs is considered cheating
            </p>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-gray-750 rounded-lg">
            <div className="bg-yellow-500/20 p-1.5 rounded-full mt-0.5">
              <Bell className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-gray-300 text-sm">
              Frequent looking away from screen will trigger warnings
            </p>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-gray-750 rounded-lg">
            <div className="bg-purple-500/20 p-1.5 rounded-full mt-0.5">
              <BarChart2 className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-gray-300 text-sm">
              You have {aptitudeTiming} minutes total and 1 minute per question
            </p>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-gray-750 rounded-lg">
            <div className="bg-green-500/20 p-1.5 rounded-full mt-0.5">
              <Activity className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-gray-300 text-sm">
              Questions appear one at a time with automatic progression
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowInstructionsModal(false)}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-green-500/20"
        >
          I Understand, Start Test
        </button>
      </div>
    </div>
  );

  const renderQuizzes = () => {
    const currentQuiz = existingQuizzes[currentQuestionIndex];
    const totalQuestions = existingQuizzes.length;
    const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

    return (
      <div className="w-full max-w-4xl mx-auto bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-700">
        {/* Overall Timer */}
        <div className="fixed top-6 left-6 bg-gradient-to-r from-red-600 to-orange-600 text-white px-5 py-2 rounded-full shadow-lg flex items-center">
          <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse mr-2"></div>
          <span className="font-bold">Total: {formatTime(timeRemaining)}</span>
        </div>

        {/* Question Timer */}
        <div className="fixed top-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-full shadow-lg flex items-center z-10">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse mr-2"></div>
          <span className="font-bold">Question: {formatTime(questionTimer)}</span>
        </div>

        <div className="text-center mb-10">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white relative z-10">
              Aptitude Test
            </h2>
          </div>
          <div className="w-48 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mx-auto mt-3"></div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 text-sm">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-gray-300 text-sm">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-900/30 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="text-red-400 mr-3" size={20} />
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        {currentQuiz ? (
          <div className="space-y-8">
            {/* Current Question */}
            <div className="bg-gray-750 p-6 rounded-xl border border-gray-600 shadow-lg">
              <div className="flex items-start mb-5">
                <div className="bg-cyan-500/20 px-3 py-1 rounded-md mr-4">
                  <span className="text-cyan-400 font-bold">
                    Q{currentQuestionIndex + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white">
                  {currentQuiz.que}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {["a", "b", "c", "d"].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(currentQuestionIndex, option)}
                    className={`py-4 px-5 rounded-xl transition-all duration-300 text-left ${
                      selectedAnswers[currentQuestionIndex] === option
                        ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg border border-cyan-400"
                        : "bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`mr-3 w-6 h-6 rounded-full flex items-center justify-center ${
                          selectedAnswers[currentQuestionIndex] === option
                            ? "bg-white text-cyan-600"
                            : "bg-gray-600 text-gray-400"
                        }`}
                      >
                        {option.toUpperCase()}
                      </div>
                      <span>{currentQuiz[option]}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={handleSkipQuestion}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all duration-300"
                  >
                    Skip Question
                  </button>

                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all duration-300"
                  >
                    {currentQuestionIndex === totalQuestions - 1 ? (
                      "Submit Test"
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Question Navigation Dots */}
            <div className="flex justify-center gap-2">
              {existingQuizzes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentQuestionIndex(index);
                    setIsQuestionTimerActive(false);
                  }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentQuestionIndex
                      ? "bg-cyan-500"
                      : answeredQuestions.has(index)
                      ? "bg-green-500"
                      : "bg-gray-600"
                  }`}
                  title={`Question ${index + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-block p-5 bg-gray-700 rounded-full mb-6">
              <Activity className="text-cyan-400" size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-300 mb-3">
              Preparing Questions
            </h3>
            <p className="text-gray-500">
              Please wait while we load your aptitude test...
            </p>
          </div>
        )}
      </div>
    );
  };

  // Main Render
  return (
    <div className="min-h-screen bg-[#0D0D0D] from-gray-900 to-black p-4 sm:p-6 font-['Poppins']">
      {testCompleted && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative bg-gray-800 border border-green-500/30 rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-t-2xl"></div>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full mb-4">
                <svg
                  className="text-green-200"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22,4 12,14.01 9,11.01" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Test Already Completed
              </h2>
              <p className="text-gray-400 mt-3">
                You have already completed the aptitude test
              </p>
            </div>

            <div className="mb-8 p-5 bg-gray-750 rounded-xl border border-green-500/50">
              <div className="text-center">
                <p className="text-gray-300 text-sm">
                  Each candidate can only take the test once. Please contact the administrator if you need assistance.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                window.close();
                window.location.href = 'about:blank';
              }}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-green-500/30"
            >
              Close Tab
            </button>
          </div>
        </div>
      )}
      {/* Video Stream Container */}
      <div className="fixed top-20 right-6 z-50">
        <div className="relative bg-gray-800 rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-72 h-56 object-cover"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-xs text-cyan-300 font-medium">
                AI Proctoring Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 pb-10">
        {!submitted ? renderUserDetailsForm() : renderQuizzes()}
      </div>

      {/* Modals */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative bg-gray-800 border border-red-500/30 rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-t-2xl"></div>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-full mb-4">
                <AlertTriangle className="text-red-200" size={32} />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Proctoring Alert
              </h2>
              <p className="text-gray-400 mt-3">
                Suspicious activity detected in your testing environment
              </p>
            </div>

            <div className="mb-6 p-4 bg-gray-750 rounded-xl">
              <img
                src={screenshot}
                alt="Screenshot"
                className="w-full rounded-lg border border-red-500/50"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-400 mb-3">
                Explain your activity (optional)
              </label>
              <textarea
                value={cheatComment}
                onChange={(e) => setCheatComment(e.target.value)}
                placeholder="I was adjusting my camera position..."
                className="w-full p-4 bg-gray-700 border border-red-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
            </div>

            <button
              onClick={handleCheatModalSubmit}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-red-500/30"
            >
              Submit Explanation
            </button>
          </div>
        </div>
      )}

      {showInstructionsModal && <InstructionsModal />}

      {showCheatingModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative bg-gray-800 border border-red-500/30 rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-t-2xl"></div>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-full mb-4">
                <AlertTriangle className="text-red-200" size={32} />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Violation Detected
              </h2>
              <p className="text-gray-400 mt-3">
                You switched tabs during the assessment
              </p>
            </div>

            <div className="mb-8 p-5 bg-gray-750 rounded-xl border border-red-500/50">
              <div className="flex items-center text-red-400">
                <AlertTriangle className="mr-3" size={24} />
                <p>
                  Test environment violations result in immediate
                  disqualification
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                cheatingDetecedByUser();
                setShowCheatingModal(false);
              }}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-red-500/30"
            >
              Acknowledge & Exit
            </button>
          </div>
        </div>
      )}

             {showLookAwayWarning && (
         <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
           <div className="relative bg-gray-800 border border-yellow-500/30 rounded-2xl p-8 max-w-md w-full mx-4">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-t-2xl"></div>

             <div className="text-center mb-6">
               <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-full mb-4">
                 <Bell className="text-yellow-200" size={32} />
               </div>
               <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                 Attention Required
               </h2>
               <p className="text-gray-400 mt-3">
                 Please stay focused on the screen
               </p>
             </div>

             <div className="mb-8 p-5 bg-gray-750 rounded-xl border border-yellow-500/50">
               <div className="flex items-center text-yellow-400">
                 <Bell className="mr-3" size={24} />
                 <p>
                   Frequent looking away from the screen may result in warnings or disqualification
                 </p>
               </div>
             </div>

             <button
               onClick={() => setShowLookAwayWarning(false)}
               className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-semibold rounded-xl hover:from-yellow-700 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-yellow-500/30"
             >
               I Understand
             </button>
           </div>
         </div>
       )}

       {showCompletionModal && (
         <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
           <div className="relative bg-gray-800 border border-green-500/30 rounded-2xl p-8 max-w-md w-full mx-4">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-t-2xl"></div>

             <div className="text-center mb-6">
               <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full mb-4">
                 <svg
                   className="text-green-200"
                   width="32"
                   height="32"
                   viewBox="0 0 24 24"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth="2"
                   strokeLinecap="round"
                   strokeLinejoin="round"
                 >
                   <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                   <polyline points="22,4 12,14.01 9,11.01" />
                 </svg>
               </div>
               <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                 Test Completed!
               </h2>
               <p className="text-gray-400 mt-3">
                 Your aptitude test has been successfully submitted
               </p>
             </div>

             <div className="mb-8 p-5 bg-gray-750 rounded-xl border border-green-500/50">
               <div className="text-center">
                 <div className="text-green-400 text-3xl font-bold mb-2">
                   Score: {score}/{existingQuizzes.length}
                 </div>
                 <p className="text-gray-300 text-sm">
                   You will receive an email with your results and next steps shortly.
                 </p>
               </div>
             </div>

             <div className="text-center text-gray-400 text-sm mb-4">
               <div className="flex items-center justify-center">
                 <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                 This tab will close automatically in 5 seconds...
               </div>
             </div>

             <button
               onClick={() => {
                 window.close();
                 window.location.href = 'about:blank';
               }}
               className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-green-500/30"
             >
               Close Now
             </button>
           </div>
         </div>
       )}
    </div>
  );
};

export default QuizComponent;
