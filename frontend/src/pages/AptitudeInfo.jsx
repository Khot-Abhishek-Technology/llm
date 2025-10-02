import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Check,
  Loader2,
  RefreshCcw,
  Edit,
  BookOpen,
  EyeOff,
} from "lucide-react";

export default function AptitudeInfo() {
  const navigate = useNavigate();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [showPreGenerated, setShowPreGenerated] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showExistingQuestions, setShowExistingQuestions] = useState(false);
  const [selectedQuizzes, setSelectedQuizzes] = useState([]);
  const [loader, setLoader] = useState(false);
  const [existingQuizzes, setExistingQuizzes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [quizzesPerPage] = useState(10);
  const [preGeneratedQuizzes, setPreGeneratedQuizzes] = useState([]);
  const [newQuiz, setNewQuiz] = useState({
    que: "",
    a: "",
    b: "",
    c: "",
    d: "",
    ans: "",
  });
  const [passingMarks, setPassingMarks] = useState(0);
  const [quizGenerationType, setQuizGenerationType] = useState("");
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Pagination logic
  const indexOfLastQuiz = currentPage * quizzesPerPage;
  const indexOfFirstQuiz = indexOfLastQuiz - quizzesPerPage;
  const currentQuizzes = existingQuizzes
    ? existingQuizzes.slice(indexOfFirstQuiz, indexOfLastQuiz)
    : [];
  const totalPages = existingQuizzes
    ? Math.ceil(existingQuizzes.length / quizzesPerPage)
    : 0;

  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const handlePreGeneratedSelect = (quiz) => {
    const updatedQuizzes = preGeneratedQuizzes.map((q) =>
      q.uniqueKey === quiz.uniqueKey ? { ...q, selected: !q.selected } : q
    );
    setPreGeneratedQuizzes(updatedQuizzes);
    setSelectedQuizzes((prev) => {
      const existingQuiz = prev.find((q) => q.que === quiz.que);
      return existingQuiz
        ? prev.filter((q) => q.que !== quiz.que)
        : [...prev, { ...quiz, uniqueKey: `pre-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }];
    });
  };

  const handleExistingQuestionSelect = (quiz) => {
    const updatedQuizzes = existingQuizzes?.map((q) =>
      q.uniqueKey === quiz.uniqueKey ? { ...q, selected: !q.selected } : q
    );
    setExistingQuizzes(updatedQuizzes);
    setSelectedQuizzes((prev) => {
      const existingQuiz = prev.find((q) => q.que === quiz.que);
      return existingQuiz
        ? prev.filter((q) => q.que !== quiz.que)
        : [...prev, { ...quiz, uniqueKey: `exist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }];
    });
  };

  const handleManualQuizSubmit = (e) => {
    e.preventDefault();
    if (!newQuiz.que || !newQuiz.a || !newQuiz.b || !newQuiz.c || !newQuiz.d || !newQuiz.ans) {
      alert("Please fill in all fields for the question.");
      return;
    }
    setSelectedQuizzes([...selectedQuizzes, {
      ...newQuiz,
      uniqueKey: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      selected: true,
    }]);
    setNewQuiz({ que: "", a: "", b: "", c: "", d: "", ans: "" });
  };

  const generateQuiz = () => {
    setLoader(true);
    axios.get(`${BACKEND_URL}/generateQuiz`, { params: { quizType: quizGenerationType } })
      .then((response) => {
        setPreGeneratedQuizzes(response.data.map((quiz) => ({
          ...quiz,
          uniqueKey: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          selected: false,
        })));
        setLoader(false);
      })
      .catch((error) => {
        console.error("Error fetching quizzes:", error);
        setLoader(false);
        alert("Failed to generate quizzes. Please try again.");
      });
  };

  const getAlreadyGeneratedQuiz = () => {
    setLoader(true);
    axios.get(`${BACKEND_URL}/getQuiz`)
      .then((response) => {
        setExistingQuizzes(response.data.map((quiz) => ({
          ...quiz,
          uniqueKey: `exist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          selected: false,
        })));
        setLoader(false);
      })
      .catch((error) => {
        console.error("Error fetching quizzes:", error);
        setLoader(false);
        alert("Failed to fetch existing quizzes. Please try again.");
      });
  };

  async function nextRound() {
    const userID = localStorage.getItem("userId");
    if (!userID) {
      console.error("User ID not found in localStorage");
      return;
    }

    try {
      await axios.post(`${BACKEND_URL}/updateUser`, {
        userId: userID,
        passingMarks,
      });

      const isTechnical = localStorage.getItem("technical");
      const isHr = localStorage.getItem("hrRound");

      if (isTechnical === "true") {
        navigate("/technicalInfo");
      } else if (isHr === "true") {
        navigate("/hrInfo");
      } else {
        navigate("/dashboard");
      }

      await axios.post(`${BACKEND_URL}/addQuiz`, {
        questions: selectedQuizzes.map((quiz) => ({
          que: quiz.que,
          a: quiz.a,
          b: quiz.b,
          c: quiz.c,
          d: quiz.d,
          ans: quiz.ans,
        })),
        userId: userID,
        passingMarks,
      });
    } catch (error) {
      console.error("Error updating user or adding quiz:", error);
      alert("Failed to process quiz. Please try again.");
    }
  }

  useEffect(() => {
    setPassingMarks(Math.ceil(selectedQuizzes.length / 2));
  }, [selectedQuizzes.length]);

  const renderQuizSection = () => {
    if (loader) {
      return (
        <div className="flex justify-center items-center my-8">
          <Loader2 className="animate-spin text-[#00BFFF] drop-shadow-[0_0_8px_#00BFFF]" size={48} />
        </div>
      );
    }

    if (showPreGenerated) {
      return (
        <div className="grid md:grid-cols-2 gap-4">
          {preGeneratedQuizzes.map((quiz) => (
            <div
              key={quiz.uniqueKey}
              onClick={() => handlePreGeneratedSelect(quiz)}
              className={`cursor-pointer p-4 rounded-lg transition-all ${
                quiz.selected
                  ? "bg-[#0d2d39] border-2 border-[#00BFFF] shadow-[0_0_10px_#00BFFF]"
                  : "bg-[#222222] border border-[#333333] hover:border-[#00BFFF] hover:shadow-[0_0_8px_#00BFFF]"
              }`}
            >
              <h3 className="font-semibold mb-2 text-gray-300">{quiz.que}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                {["a", "b", "c", "d"].map((option) => (
                  <div key={option}>
                    {option.toUpperCase()}: {quiz[option]}
                  </div>
                ))}
              </div>
              {quiz.selected && (
                <div className="mt-2 text-[#00FF99] text-sm flex items-center">
                  <Check className="mr-1" size={16} /> Selected
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (showExistingQuestions) {
      return (
        <div>
          <div className="grid md:grid-cols-2 gap-4">
            {currentQuizzes.map((quiz) => (
              <div
                key={quiz.uniqueKey}
                onClick={() => handleExistingQuestionSelect(quiz)}
                className={`cursor-pointer p-4 rounded-lg transition-all ${
                  quiz.selected
                    ? "bg-[#1a0d39] border-2 border-[#B266FF] shadow-[0_0_10px_#B266FF]"
                    : "bg-[#222222] border border-[#333333] hover:border-[#B266FF] hover:shadow-[0_0_8px_#B266FF]"
                }`}
              >
                <h3 className="font-semibold mb-2 text-gray-300">{quiz.que}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                  {["a", "b", "c", "d"].map((option) => (
                    <div key={option}>
                      {option.toUpperCase()}: {quiz[option]}
                    </div>
                  ))}
                </div>
                {quiz.selected && (
                  <div className="mt-2 text-[#B266FF] text-sm flex items-center">
                    <Check className="mr-1" size={16} /> Selected
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="mt-6 flex items-center justify-between bg-[#222222] px-4 py-3 sm:px-6 rounded-lg border border-[#333333]">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                  currentPage === 1
                    ? "bg-[#333333] text-gray-500 cursor-not-allowed"
                    : "bg-[#1A1A1A] text-gray-300 hover:bg-[#2a2a2a]"
                }`}
              >
                Previous
              </button>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                  currentPage === totalPages
                    ? "bg-[#333333] text-gray-500 cursor-not-allowed"
                    : "bg-[#1A1A1A] text-gray-300 hover:bg-[#2a2a2a]"
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  Showing <span className="font-medium text-white">{indexOfFirstQuiz + 1}</span> to{" "}
                  <span className="font-medium text-white">
                    {Math.min(indexOfLastQuiz, existingQuizzes?.length)}
                  </span> of{" "}
                  <span className="font-medium text-white">{existingQuizzes?.length}</span> questions
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center rounded-l-md px-4 py-2 text-sm font-medium ${
                      currentPage === 1
                        ? "bg-[#333333] text-gray-500 cursor-not-allowed"
                        : "bg-[#1A1A1A] text-gray-300 hover:bg-[#2a2a2a]"
                    }`}
                  >
                    Previous
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-300 bg-[#1A1A1A]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center rounded-r-md px-4 py-2 text-sm font-medium ${
                      currentPage === totalPages
                        ? "bg-[#333333] text-gray-500 cursor-not-allowed"
                        : "bg-[#1A1A1A] text-gray-300 hover:bg-[#2a2a2a]"
                    }`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (showManualForm) {
      return (
        <form onSubmit={handleManualQuizSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#00FF99] mb-1">
              Question
            </label>
            <input
              type="text"
              value={newQuiz.que}
              onChange={(e) => setNewQuiz({ ...newQuiz, que: e.target.value })}
              placeholder="Enter your question"
              className="w-full p-3 bg-[#1A1A1A] border border-[#333333] text-gray-300 rounded-lg focus:outline-none focus:border-[#00FF99] focus:ring-1 focus:ring-[#00FF99]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {["a", "b", "c", "d"].map((option) => (
              <div key={option}>
                <label className="block text-sm font-medium text-[#00FF99] mb-1">
                  Option {option.toUpperCase()}
                </label>
                <input
                  type="text"
                  value={newQuiz[option]}
                  onChange={(e) => setNewQuiz({ ...newQuiz, [option]: e.target.value })}
                  placeholder={`Enter option ${option.toUpperCase()}`}
                  className="w-full p-3 bg-[#1A1A1A] border border-[#333333] text-gray-300 rounded-lg focus:outline-none focus:border-[#00FF99] focus:ring-1 focus:ring-[#00FF99]"
                  required
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#00FF99] mb-1">
              Correct Answer
            </label>
            <select
              value={newQuiz.ans}
              onChange={(e) => setNewQuiz({ ...newQuiz, ans: e.target.value })}
              className="w-full p-3 bg-[#1A1A1A] border border-[#333333] text-gray-300 rounded-lg focus:outline-none focus:border-[#00FF99] focus:ring-1 focus:ring-[#00FF99]"
              required
            >
              <option value="" className="bg-[#1A1A1A]">Select Correct Option</option>
              <option value="a" className="bg-[#1A1A1A]">Option A</option>
              <option value="b" className="bg-[#1A1A1A]">Option B</option>
              <option value="c" className="bg-[#1A1A1A]">Option C</option>
              <option value="d" className="bg-[#1A1A1A]">Option D</option>
            </select>
          </div>

          <div className="text-right">
            <button
              type="submit"
              className="bg-[#00FF99] text-[#0D0D0D] px-6 py-2 rounded-lg hover:bg-[#00cc7a] hover:shadow-[0_0_10px_#00FF99] transition-all font-bold"
            >
              Add Question
            </button>
          </div>
        </form>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-[#1A1A1A] shadow-xl rounded-xl border border-[#333333] p-6 md:p-8 relative">
        {/* Glowing accent elements */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00BFFF] to-[#1E90FF]"></div>
        <div className="absolute top-10 right-10 w-4 h-4 rounded-full bg-[#00FF99] shadow-[0_0_15px_#00FF99]"></div>
        <div className="absolute bottom-20 left-1/4 w-4 h-4 rounded-full bg-[#B266FF] shadow-[0_0_15px_#B266FF]"></div>

        <h1 className="text-3xl md:text-4xl font-extrabold mb-8 text-center flex items-center justify-center">
          <BookOpen className="mr-3 text-[#00BFFF] drop-shadow-[0_0_8px_#00BFFF]" size={36} />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00BFFF] to-[#1E90FF]">
            Aptitude Question Hub
          </span>
        </h1>

        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button
            onClick={() => {
              setShowPreGenerated(true);
              setShowManualForm(false);
              setShowExistingQuestions(false);
            }}
            className="flex items-center py-3 px-6 rounded-lg bg-gradient-to-r from-[#00BFFF] to-[#1E90FF] text-white hover:from-[#00a5e0] hover:to-[#1a7fcc] hover:shadow-[0_0_15px_#00BFFF] transition-all group"
          >
            <RefreshCcw className="mr-2 group-hover:animate-spin" size={18} />
            Generate New Questions
          </button>
          <button
            onClick={() => {
              setShowManualForm(true);
              setShowPreGenerated(false);
              setShowExistingQuestions(false);
            }}
            className="flex items-center py-3 px-6 rounded-lg bg-gradient-to-r from-[#00FF99] to-[#00cc7a] text-[#0D0D0D] hover:from-[#00cc7a] hover:to-[#00a566] hover:shadow-[0_0_15px_#00FF99] transition-all font-bold"
          >
            <Edit className="mr-2" size={18} />
            Create Questions Manually
          </button>
          <button
            onClick={() => {
              setShowExistingQuestions(true);
              setShowPreGenerated(false);
              getAlreadyGeneratedQuiz();
              setShowManualForm(false);
            }}
            className="flex items-center py-3 px-6 rounded-lg bg-gradient-to-r from-[#B266FF] to-[#9933ff] text-white hover:from-[#9933ff] hover:to-[#8000ff] hover:shadow-[0_0_15px_#B266FF] transition-all"
          >
            <BookOpen className="mr-2" size={18} />
            View Existing Questions
          </button>
        </div>

        {showPreGenerated && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#00BFFF] mb-2">
              Specify Aptitude Question Type
            </label>
            <div className="flex">
              <input
                type="text"
                value={quizGenerationType}
                onChange={(e) => setQuizGenerationType(e.target.value)}
                placeholder="e.g., Reasoning, Numeric, Logical..."
                className="flex-grow p-3 bg-[#1A1A1A] border border-[#333333] text-gray-300 rounded-l-lg focus:outline-none focus:border-[#00BFFF] focus:ring-1 focus:ring-[#00BFFF]"
              />
              <button
                onClick={generateQuiz}
                className="bg-gradient-to-r from-[#00BFFF] to-[#1E90FF] text-white px-6 rounded-r-lg hover:from-[#00a5e0] hover:to-[#1a7fcc] hover:shadow-[0_0_10px_#00BFFF] transition-all"
              >
                Generate
              </button>
            </div>
          </div>
        )}

        {(showManualForm || showPreGenerated || showExistingQuestions) && (
          <div className="mt-4">{renderQuizSection()}</div>
        )}

        {selectedQuizzes.length > 0 && (
          <div className="mt-6 bg-[#222222] p-4 rounded-lg border border-[#333333] flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-gray-300 font-medium">
                  Passing Marks:
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedQuizzes.length}
                  value={passingMarks}
                  onChange={(e) =>
                    setPassingMarks(
                      Math.min(
                        Math.max(parseInt(e.target.value, 10), 0),
                        selectedQuizzes.length
                      )
                    )
                  }
                  className="bg-[#1A1A1A] border border-[#333333] text-white rounded px-2 py-1 w-20 focus:border-[#00BFFF] focus:ring-1 focus:ring-[#00BFFF]"
                />
                <span className="text-gray-400 text-sm">
                  ({passingMarks}/{selectedQuizzes.length})
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setReviewModalOpen(true)}
                className="flex items-center bg-gradient-to-r from-[#B266FF] to-[#9933ff] text-white px-6 py-2 rounded hover:from-[#9933ff] hover:to-[#8000ff] hover:shadow-[0_0_10px_#B266FF] transition-all"
              >
                <BookOpen className="mr-2" size={18} />
                Review Selected Questions
              </button>
              <button
                onClick={nextRound}
                className="flex items-center bg-gradient-to-r from-[#00BFFF] to-[#1E90FF] text-white px-6 py-2 rounded hover:from-[#00a5e0] hover:to-[#1a7fcc] hover:shadow-[0_0_15px_#00BFFF] transition-all"
              >
                Next Round
                <ChevronRight className="ml-2" size={18} />
              </button>
            </div>
          </div>
        )}

        {reviewModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1A1A1A] rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-[#333333] shadow-[0_0_20px_#00BFFF]">
              <div className="p-6 border-b border-[#333333] sticky top-0 bg-[#1A1A1A] z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">
                    Selected Aptitude Questions
                  </h2>
                  <button
                    onClick={() => setReviewModalOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <EyeOff size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto">
                {selectedQuizzes.map((quiz, index) => (
                  <div
                    key={quiz.uniqueKey}
                    className="border-b border-[#333333] py-3 last:border-b-0"
                  >
                    <h3 className="font-semibold text-lg mb-2 text-gray-300">{`Q${
                      index + 1
                    }. ${quiz.que}`}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {["a", "b", "c", "d"].map((option) => (
                        <div
                          key={option}
                          className={`p-2 rounded ${
                            quiz.ans === option
                              ? "bg-[#0d391d] text-[#00FF99] border border-[#008855]"
                              : "bg-[#222222] text-gray-400 border border-[#333333]"
                          }`}
                        >
                          {option.toUpperCase()}: {quiz[option]}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="mt-4 flex justify-between items-center bg-[#222222] p-3 rounded border border-[#333333]">
                  <span className="font-medium text-gray-300">
                    Passing Marks:
                  </span>
                  <span className="text-lg font-bold text-[#00BFFF]">
                    {passingMarks} / {selectedQuizzes.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}