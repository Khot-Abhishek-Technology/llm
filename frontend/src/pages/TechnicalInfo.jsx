import axios from "axios";
import {
  BookOpen,
  ChevronRight,
  Code,
  Edit,
  EyeOff,
  Loader2,
  RefreshCcw,
  Check, // Added Check icon import
} from "lucide-react";
import { useEffect, useState } from "react";

export default function TechnicalInfo() {
  const [showPreGenerated, setShowPreGenerated] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showExistingProblems, setShowExistingProblems] = useState(false);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loader, setLoader] = useState(false);
  const [passingMarks, setPassingMarks] = useState(0);
  const [techInputField, setTechInputField] = useState(false);
  const [techGenerationType, setTechGenerationType] = useState("");
  const [generatedProblems, setGeneratedProblems] = useState([]);
  const [showGeneratedProblems, setShowGeneratedProblems] = useState(false);

  const [preGeneratedProblems, setPreGeneratedProblems] = useState([]);
  const [existingProblems, setExistingProblems] = useState([]);
  const [newProblem, setNewProblem] = useState({
    title: "",
    desc: "",
  });

  const [problemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastQuiz = currentPage * problemsPerPage;
  const indexOfFirstQuiz = indexOfLastQuiz - problemsPerPage;
  const currentExistingProblems = existingProblems
    ? existingProblems.slice(indexOfFirstQuiz, indexOfLastQuiz)
    : [];
  const totalPages = existingProblems
    ? Math.ceil(existingProblems.length / problemsPerPage)
    : 0;

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePreGeneratedSelect = (problem) => {
    setSelectedProblems((prevSelectedProblems) => {
      const problemIndex = prevSelectedProblems.findIndex(
        (p) => p.id === problem.id
      );
      return problemIndex > -1
        ? prevSelectedProblems.filter((p) => p.id !== problem.id)
        : [...prevSelectedProblems, problem];
    });
  };

  const handleManualProblemSubmit = (e) => {
    e.preventDefault();
    const newProblemWithId = {
      ...newProblem,
      id: Date.now().toString(),
    };
    setSelectedProblems([...selectedProblems, newProblemWithId]);
    setNewProblem({
      title: "",
      desc: "",
    });
  };

  const handleExistingProblemSelect = (problem) => {
    setSelectedProblems((prevSelectedProblems) => {
      const problemIndex = prevSelectedProblems.findIndex(
        (p) => p.id === problem.id
      );
      return problemIndex > -1
        ? prevSelectedProblems.filter((p) => p.id !== problem.id)
        : [...prevSelectedProblems, problem];
    });
  };

  const generateTechnicalProblems = () => {
    setLoader(true);
    axios
      .get(`${BACKEND_URL}/generateTech`, {
        timeout: 30000,
        params: { techType: techGenerationType },
      })
      .then((response) => {
        setShowGeneratedProblems(true);
        setGeneratedProblems(response.data);
        setLoader(false);
      })
      .catch((error) => {
        console.error("Error fetching technical problems:", error);
        setLoader(false);
        setGeneratedProblems([]);
      });
  };

  const getAlreadyGeneratedProblems = () => {
    setLoader(true);
    fetch(`${BACKEND_URL}/getTech`)
      .then((response) => response.json())
      .then((data) => {
        setExistingProblems(data.techEntries);
        setLoader(false);
      })
      .catch((error) => {
        console.error("Error fetching technical problems:", error);
        setLoader(false);
        setExistingProblems([
          {
            id: "E1C9Z",
            title: "Implement a Stack",
            desc: "Design a stack data structure with push, pop, and top operations.\n\nImplement methods:\n- push(x): Adds an element to the top of the stack\n- pop(): Removes and returns the top element\n- top(): Returns the top element without removing it\n- isEmpty(): Checks if the stack is empty\n\nConstraints: Implement without using built-in stack data structures.",
          },
          {
            id: "E2D7W",
            title: "Binary Search Implementation",
            desc: "Implement a binary search algorithm on a sorted array.\n\nFunctions to implement:\n- binarySearch(arr, target): Returns the index of the target element\n- If not found, return -1\n\nExample:\nInput: arr = [1, 3, 5, 7, 9], target = 5\nOutput: 2\n\nConstraints: Array is sorted in ascending order. Time complexity should be O(log n).",
          },
        ]);
      });
  };

  const nextRound = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/updateUser`, {
        userId: localStorage.getItem("userId"),
        passingMarksofTech: passingMarks,
      });

      console.log("updated passing marks in backend", response);
    } catch (error) {
      console.log("Error updating candidates:", error);
    }
    const isHr = localStorage.getItem("hrRound");

    try {
      const response = await axios.post(`${BACKEND_URL}/addTech`, {
        problems: JSON.stringify({ problems: selectedProblems }),
        // problems: selectedProblems,
        userId: localStorage.getItem("userId"),
      });

      console.log("Tech problems added:", response.data);
    } catch (error) {
      console.error("Error adding tech problems:", error);
    }

    if (isHr === "true") {
      window.location.href = "/hrInfo";
    } else {
      window.location.href = "/dashboard";
    }
  };

  useEffect(() => {
    setPassingMarks(Math.ceil(selectedProblems.length / 2));
  }, [selectedProblems.length]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-[#1A1A1A] shadow-xl rounded-xl border border-[#333333] p-6 md:p-8 relative">
        {/* Glowing accent elements */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00BFFF] to-[#1E90FF]"></div>
        <div className="absolute top-10 right-10 w-4 h-4 rounded-full bg-[#00FF99] shadow-[0_0_15px_#00FF99]"></div>
        <div className="absolute bottom-20 left-1/4 w-4 h-4 rounded-full bg-[#B266FF] shadow-[0_0_15px_#B266FF]"></div>

        <h1 className="text-3xl md:text-4xl font-extrabold mb-8 text-center flex items-center justify-center">
          <Code
            className="mr-3 text-[#00BFFF] drop-shadow-[0_0_8px_#00BFFF]"
            size={36}
          />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00BFFF] to-[#1E90FF]">
            Technical Question Hub
          </span>
        </h1>

        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button
            onClick={() => {
              setTechInputField(true);
              setShowPreGenerated(false);
              setShowManualForm(false);
              setShowExistingProblems(false);
            }}
            className="flex items-center py-3 px-6 rounded-lg bg-gradient-to-r from-[#00BFFF] to-[#1E90FF] text-white hover:from-[#00a5e0] hover:to-[#1a7fcc] hover:shadow-[0_0_15px_#00BFFF] transition-all group"
          >
            <RefreshCcw className="mr-2 group-hover:animate-spin" size={18} />
            Generate New Problems
          </button>

          <button
            onClick={() => {
              setTechInputField(false);
              setShowManualForm(true);
              setShowPreGenerated(false);
              setShowExistingProblems(false);
              setShowGeneratedProblems(false);
            }}
            className="flex items-center py-3 px-6 rounded-lg bg-gradient-to-r from-[#00FF99] to-[#00cc7a] text-[#0D0D0D] hover:from-[#00cc7a] hover:to-[#00a566] hover:shadow-[0_0_15px_#00FF99] transition-all font-bold"
          >
            <Edit className="mr-2" size={18} />
            Create Problem Manually
          </button>
          <button
            onClick={() => {
              setTechInputField(false);
              setShowExistingProblems(true);
              setShowPreGenerated(false);
              getAlreadyGeneratedProblems();
              setShowManualForm(false);
              setShowGeneratedProblems(false);
            }}
            className="flex items-center py-3 px-6 rounded-lg bg-gradient-to-r from-[#B266FF] to-[#9933ff] text-white hover:from-[#9933ff] hover:to-[#8000ff] hover:shadow-[0_0_15px_#B266FF] transition-all"
          >
            <BookOpen className="mr-2" size={18} />
            View Existing Problems
          </button>
        </div>

        {techInputField && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#00BFFF] mb-2">
              Specify Technical Question Type
            </label>
            <div className="flex">
              <input
                type="text"
                value={techGenerationType}
                onChange={(e) => setTechGenerationType(e.target.value)}
                placeholder="e.g., Arrays, Linked Lists, Easy, Difficult etc."
                className="flex-grow p-3 bg-[#1A1A1A] border border-[#333333] text-gray-300 rounded-l-lg focus:outline-none focus:border-[#00BFFF] focus:ring-1 focus:ring-[#00BFFF]"
              />
              <button
                onClick={() => {
                  generateTechnicalProblems();
                  setShowManualForm(false);
                  setShowExistingProblems(false);
                }}
                className="bg-gradient-to-r from-[#00BFFF] to-[#1E90FF] text-white px-6 rounded-r-lg hover:from-[#00a5e0] hover:to-[#1a7fcc] hover:shadow-[0_0_10px_#00BFFF] transition-all"
              >
                Generate
              </button>
            </div>
          </div>
        )}

        {loader && (
          <div className="flex justify-center items-center my-8">
            <Loader2
              className="animate-spin text-[#00BFFF] drop-shadow-[0_0_8px_#00BFFF]"
              size={48}
            />
          </div>
        )}

        {showGeneratedProblems && !loader && (
          <div className="grid md:grid-cols-2 gap-4">
            {generatedProblems.map((problem) => (
              <div
                key={problem.id}
                onClick={() => handlePreGeneratedSelect(problem)}
                className={`
                  cursor-pointer p-4 rounded-lg transition-all 
                  ${
                    selectedProblems.some((p) => p.id === problem.id)
                      ? "bg-[#0d2d39] border-2 border-[#00BFFF] shadow-[0_0_10px_#00BFFF]"
                      : "bg-[#222222] border border-[#333333] hover:border-[#00BFFF] hover:shadow-[0_0_8px_#00BFFF]"
                  }
                `}
              >
                <h3 className="font-semibold mb-2 text-gray-300">
                  {problem.title}
                </h3>
                <p className="text-sm mb-2 text-gray-400 whitespace-pre-wrap">
                  {problem.desc.length > 200
                    ? `${problem.desc.substring(0, 200)}...`
                    : problem.desc}
                </p>
                {selectedProblems.some((p) => p.id === problem.id) && (
                  <div className="mt-2 text-[#00FF99] text-sm flex items-center">
                    <Check className="mr-1" size={16} /> Selected
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showPreGenerated && !loader && (
          <div className="grid md:grid-cols-2 gap-4">
            {preGeneratedProblems.map((problem) => (
              <div
                key={problem.id}
                onClick={() => handlePreGeneratedSelect(problem)}
                className={`
                  cursor-pointer p-4 rounded-lg transition-all 
                  ${
                    selectedProblems.some((p) => p.id === problem.id)
                      ? "bg-[#0d2d39] border-2 border-[#00BFFF] shadow-[0_0_10px_#00BFFF]"
                      : "bg-[#222222] border border-[#333333] hover:border-[#00BFFF] hover:shadow-[0_0_8px_#00BFFF]"
                  }
                `}
              >
                <h3 className="font-semibold mb-2 text-gray-300">
                  {problem.title}
                </h3>
                <p className="text-sm mb-2 text-gray-400 whitespace-pre-wrap">
                  {problem.desc.length > 200
                    ? `${problem.desc.substring(0, 200)}...`
                    : problem.desc}
                </p>
                {selectedProblems.some((p) => p.id === problem.id) && (
                  <div className="mt-2 text-[#00FF99] text-sm flex items-center">
                    <Check className="mr-1" size={16} /> Selected
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showExistingProblems && !loader && (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              {currentExistingProblems?.map((problem) => (
                <div
                  key={problem.id}
                  onClick={() => handleExistingProblemSelect(problem)}
                  className={`
                  cursor-pointer p-4 rounded-lg transition-all 
                  ${
                    selectedProblems.some((p) => p.id === problem.id)
                      ? "bg-[#1a0d39] border-2 border-[#B266FF] shadow-[0_0_10px_#B266FF]"
                      : "bg-[#222222] border border-[#333333] hover:border-[#B266FF] hover:shadow-[0_0_8px_#B266FF]"
                  }
                `}
                >
                  <h3 className="font-semibold mb-2 text-gray-300">
                    {problem.title}
                  </h3>
                  <p className="text-sm mb-2 text-gray-400 whitespace-pre-wrap">
                    {problem.desc?.length > 200
                      ? `${problem.desc.substring(0, 200)}...`
                      : problem.desc}
                  </p>
                  {selectedProblems?.some((p) => p.id === problem.id) && (
                    <div className="mt-2 text-[#B266FF] text-sm flex items-center">
                      <Check className="mr-1" size={16} /> Selected
                    </div>
                  )}
                </div>
              ))}
            </div>
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
                    Showing{" "}
                    <span className="font-medium text-white">
                      {indexOfFirstQuiz + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium text-white">
                      {Math.min(indexOfLastQuiz, existingProblems?.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-white">
                      {existingProblems?.length}
                    </span>{" "}
                    questions
                  </p>
                </div>
                <div>
                  <nav
                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
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
          </>
        )}

        {showManualForm && (
          <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#333333]">
            <form onSubmit={handleManualProblemSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#00FF99] mb-1">
                  Problem Title
                </label>
                <input
                  type="text"
                  value={newProblem.title}
                  onChange={(e) =>
                    setNewProblem({ ...newProblem, title: e.target.value })
                  }
                  className="w-full p-3 bg-[#1A1A1A] border border-[#333333] text-gray-300 rounded-lg focus:outline-none focus:border-[#00FF99] focus:ring-1 focus:ring-[#00FF99]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#00FF99] mb-1">
                  Problem Description
                </label>
                <textarea
                  value={newProblem.desc}
                  onChange={(e) =>
                    setNewProblem({ ...newProblem, desc: e.target.value })
                  }
                  className="w-full p-3 bg-[#1A1A1A] border border-[#333333] text-gray-300 rounded-lg focus:outline-none focus:border-[#00FF99] focus:ring-1 focus:ring-[#00FF99]"
                  required
                />
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
          </div>
        )}

        {selectedProblems.length > 0 && (
          <div className="mt-6 bg-[#222222] p-4 rounded-lg border border-[#333333] flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-gray-300 font-medium">
                  Passing Marks:
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedProblems.length}
                  value={passingMarks}
                  onChange={(e) =>
                    setPassingMarks(
                      Math.min(
                        Math.max(parseInt(e.target.value, 10), 0),
                        selectedProblems.length
                      )
                    )
                  }
                  className="bg-[#1A1A1A] border border-[#333333] text-white rounded px-2 py-1 w-20 focus:border-[#00BFFF] focus:ring-1 focus:ring-[#00BFFF]"
                />
                <span className="text-gray-400 text-sm">
                  ({passingMarks}/{selectedProblems.length})
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowReviewModal(true)}
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

        {showReviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1A1A1A] rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-[#333333] shadow-[0_0_20px_#00BFFF]">
              <div className="p-6 border-b border-[#333333] sticky top-0 bg-[#1A1A1A] z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">
                    Selected Technical Problems
                  </h2>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <EyeOff size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto">
                {selectedProblems.map((problem, index) => (
                  <div
                    key={problem.id}
                    className="border-b border-[#333333] py-3 last:border-b-0"
                  >
                    <h3 className="font-semibold text-lg mb-2 text-gray-300">
                      Q{index + 1}. {problem.title}
                    </h3>
                    <p className="text-gray-400 whitespace-pre-wrap">
                      {problem.desc}
                    </p>
                  </div>
                ))}

                <div className="mt-4 flex justify-between items-center bg-[#222222] p-3 rounded border border-[#333333]">
                  <span className="font-medium text-gray-300">
                    Passing Marks:
                  </span>
                  <span className="text-lg font-bold text-[#00BFFF]">
                    {passingMarks} / {selectedProblems.length}
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
