import axios from "axios";
import { useState } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const RecruiterInfo = () => {
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [date, setDate] = useState(null);
  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [jobrole, setjobRole] = useState(localStorage.getItem("jobRole") || "");
  const [companyName, setCompanyName] = useState(
    localStorage.getItem("companyName") || ""
  );
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !companyName || !jobrole) {
      alert("Please fill in all required fields.");
      return;
    }

    const data = {
      userId: localStorage.getItem("userId"),
      name,
      email,
      companyName,
      jobrole,
      date: dayjs(date).format("DD MMM YYYY"),
      startTime: startTime
        ? dayjs(`${date}T${startTime}`).format("HH:mm")
        : null,
      endTime: endTime ? dayjs(`${date}T${endTime}`).format("HH:mm") : null,
    };

    try {
      const response = await axios.post(`${BACKEND_URL}/updateUser`, data, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 200) {
        alert("Interview time scheduled successfully!");
        localStorage.setItem("companyName", companyName);
        localStorage.setItem("jobRole", jobrole);
        localStorage.setItem("startTime", startTime);
        localStorage.setItem("endTime", endTime);
        localStorage.setItem("date", date);

        setName("");
        setEmail("");
        setCompanyName("");
        setjobRole("");
        setStartTime(null);
        setEndTime(null);
        setDate(null);

        navigate("/candidateUpload");
      } else {
        alert("Failed to schedule interview time");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("An error occurred while scheduling the interview");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] p-6">
      <div className="w-full max-w-3xl bg-[#1A1A1A] rounded-xl border border-[#333333] overflow-hidden relative shadow-2xl">
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
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00BFFF] to-[#1E90FF]">
              Recruiter Information
            </span>
          </h1>
          <p className="text-sm text-center text-gray-400 mt-1">
            Please add your recruiting details below
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-3">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[#00BFFF]"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#222222] border border-[#333333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BFFF] focus:border-transparent glow-blue-sm transition-all duration-200"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-3">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#00FF99]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#222222] border border-[#333333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00FF99] focus:border-transparent glow-green-sm transition-all duration-200"
              />
            </div>

            {/* Company Name Field */}
            <div className="space-y-3">
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-[#B266FF]"
              >
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                placeholder="Enter your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 bg-[#222222] border border-[#333333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#B266FF] focus:border-transparent glow-purple-sm transition-all duration-200"
              />
            </div>

            {/* Job Role Field */}
            <div className="space-y-3">
              <label
                htmlFor="jobRole"
                className="block text-sm font-medium text-[#FF7F50]"
              >
                Job Role (for what position you are recruiting)
              </label>
              <input
                id="jobRole"
                type="text"
                placeholder="Enter job role"
                value={jobrole}
                onChange={(e) => setjobRole(e.target.value)}
                className="w-full px-4 py-3 bg-[#222222] border border-[#333333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF7F50] focus:border-transparent glow-orange-sm transition-all duration-200"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-6 rounded-lg font-bold text-white transition-all duration-300 flex items-center justify-center glow-blue hover:glow-blue-lg"
              style={{
                background: "linear-gradient(to right, #00BFFF, #1E90FF)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              Submit
            </button>
          </form>
        </div>

        {/* Footer Glow */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#00BFFF] via-[#B266FF] to-[#FF7F50]"></div>
      </div>

      {/* Add global styles for glow effects */}
      <style jsx>{`
        .glow-blue {
          box-shadow: 0 0 10px rgba(0, 191, 255, 0.3);
        }
        .glow-blue-lg {
          box-shadow: 0 0 20px rgba(0, 191, 255, 0.5);
        }
        .glow-blue-sm {
          box-shadow: 0 0 5px rgba(0, 191, 255, 0.3);
        }
        .glow-green {
          box-shadow: 0 0 10px rgba(0, 255, 153, 0.3);
        }
        .glow-green-sm {
          box-shadow: 0 0 5px rgba(0, 255, 153, 0.3);
        }
        .glow-purple {
          box-shadow: 0 0 10px rgba(178, 102, 255, 0.3);
        }
        .glow-purple-sm {
          box-shadow: 0 0 5px rgba(178, 102, 255, 0.3);
        }
        .glow-orange {
          box-shadow: 0 0 10px rgba(255, 127, 80, 0.3);
        }
        .glow-orange-sm {
          box-shadow: 0 0 5px rgba(255, 127, 80, 0.3);
        }
      `}</style>
    </div>
  );
};

export default RecruiterInfo;
