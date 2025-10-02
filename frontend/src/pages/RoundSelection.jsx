import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

const RoundSelection = () => {
  const [selectedRounds, setSelectedRounds] = useState({
    aptitude: true,
    technical: true,
    hrRound: true,
  });
  const [userid, setuserid] = useState("");

  const [roundDurations, setRoundDurations] = useState({
    aptitude: "30",
    technical: "60",
    hrRound: "60",
  });
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.error("No userId found in localStorage.");
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/getUserInfo/${userId}`);
      console.log("Dashboard data:", response.data);
      setuserid(response.data._id);
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const handleRoundChange = (round) => {
    setSelectedRounds((prev) => ({
      ...prev,
      [round]: !prev[round],
    }));
    if (selectedRounds[round]) {
      setRoundDurations((prev) => ({
        ...prev,
        [round]: "0",
      }));
    }
  };

  const handleDurationChange = (round, value) => {
    setRoundDurations((prev) => ({
      ...prev,
      [round]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/updateUser`, {
        userId: userid,
        aptitudeTime: roundDurations.aptitude,
        techTime: roundDurations.technical,
        hrTime: roundDurations.hrRound,
      });
      console.log("Round times updated successfully:", response.data);

      if (selectedRounds.aptitude) {
        localStorage.setItem("aptitude", true);
        localStorage.setItem(
          "aptitudeDuration",
          roundDurations.aptitude || "0"
        );
      }
      if (selectedRounds.technical) {
        localStorage.setItem("technical", true);
        localStorage.setItem(
          "technicalDuration",
          roundDurations.technical || "0"
        );
      }
      if (selectedRounds.hrRound) {
        localStorage.setItem("hrRound", true);
        localStorage.setItem("hrRoundDuration", roundDurations.hrRound || "0");
      }

      if (selectedRounds.aptitude) {
        navigate("/aptitudeInfo");
      } else if (selectedRounds.technical) {
        navigate("/technicalInfo");
      } else if (selectedRounds.hrRound) {
        navigate("/hrInfo");
      } else {
        alert("Please select at least one round.");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D]">
      <div className="flex flex-1 items-start justify-center p-6">
        <div className="w-full max-w-2xl bg-[#1A1A1A] rounded-xl border border-[#333333] overflow-hidden relative">
          {/* Glowing accent elements */}
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00BFFF] to-[#1E90FF]"></div>
          <div className="absolute top-10 right-10 w-4 h-4 rounded-full bg-[#00FF99] shadow-[0_0_15px_#00FF99]"></div>
          <div className="absolute bottom-20 left-1/4 w-4 h-4 rounded-full bg-[#B266FF] shadow-[0_0_15px_#B266FF]"></div>

          {/* Header */}
          <div className="bg-[#1A1A1A] border-b border-[#333333] px-6 py-4">
            <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00BFFF] to-[#1E90FF]">
                Rounds Selection
              </span>
            </h1>
            <p className="text-lg text-gray-400 text-center mt-2">
              Choose which interview rounds you would like to conduct
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            <div className="space-y-6 bg-[#222222] p-6 rounded-lg border border-[#333333]">
              {/* Aptitude Round */}
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    id="aptitude"
                    checked={selectedRounds.aptitude}
                    onChange={() => handleRoundChange("aptitude")}
                    className="w-5 h-5 rounded border-2 border-[#00FF99] bg-[#1A1A1A] text-[#00FF99] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label
                    htmlFor="aptitude"
                    className="text-xl font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                  >
                    Aptitude/Reasoning Round
                  </label>
                </div>
                {selectedRounds.aptitude && (
                  <div className="ml-9 pl-2 border-l-2 border-[#00FF99]">
                    <label
                      htmlFor="aptitudeTime"
                      className="block text-[#00FF99] text-sm font-medium mb-1"
                    >
                      Duration (minutes):
                    </label>
                    <input
                      type="number"
                      id="aptitudeTime"
                      step="5"
                      min="0"
                      value={roundDurations.aptitude}
                      onChange={(e) =>
                        handleDurationChange("aptitude", e.target.value)
                      }
                      className="bg-[#1A1A1A] border border-[#444444] text-white rounded-md px-3 py-2 w-24 focus:border-[#00FF99] focus:ring-1 focus:ring-[#00FF99] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Technical Round */}
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    id="technical"
                    checked={selectedRounds.technical}
                    onChange={() => handleRoundChange("technical")}
                    className="w-5 h-5 rounded border-2 border-[#B266FF] bg-[#1A1A1A] text-[#B266FF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label
                    htmlFor="technical"
                    className="text-xl font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                  >
                    Technical Round
                  </label>
                </div>
                {selectedRounds.technical && (
                  <div className="ml-9 pl-2 border-l-2 border-[#B266FF]">
                    <label
                      htmlFor="technicalTime"
                      className="block text-[#B266FF] text-sm font-medium mb-1"
                    >
                      Duration (minutes):
                    </label>
                    <input
                      type="number"
                      id="technicalTime"
                      min="0"
                      step="5"
                      value={roundDurations.technical}
                      onChange={(e) =>
                        handleDurationChange("technical", e.target.value)
                      }
                      className="bg-[#1A1A1A] border border-[#444444] text-white rounded-md px-3 py-2 w-24 focus:border-[#B266FF] focus:ring-1 focus:ring-[#B266FF] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* HR Round */}
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    id="hrRound"
                    checked={selectedRounds.hrRound}
                    onChange={() => handleRoundChange("hrRound")}
                    className="w-5 h-5 rounded border-2 border-[#FF7F50] bg-[#1A1A1A] text-[#FF7F50] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label
                    htmlFor="hrRound"
                    className="text-xl font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                  >
                    HR Round/Final Interview
                  </label>
                </div>
                {selectedRounds.hrRound && (
                  <div className="ml-9 pl-2 border-l-2 border-[#FF7F50]">
                    <label
                      htmlFor="hrTime"
                      className="block text-[#FF7F50] text-sm font-medium mb-1"
                    >
                      Duration (minutes):
                    </label>
                    <input
                      type="number"
                      id="hrTime"
                      min="0"
                      step="5"
                      value={roundDurations.hrRound}
                      onChange={(e) =>
                        handleDurationChange("hrRound", e.target.value)
                      }
                      className="bg-[#1A1A1A] border border-[#444444] text-white rounded-md px-3 py-2 w-24 focus:border-[#FF7F50] focus:ring-1 focus:ring-[#FF7F50] focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full mt-4 py-3 px-6 text-lg font-bold text-white bg-gradient-to-r from-[#00BFFF] to-[#1E90FF] hover:from-[#00a5e0] hover:to-[#1a7fcc] rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-[0_0_15px_#00BFFF] transform hover:scale-[1.02]"
            >
              Confirm Selection
            </button>
          </div>

          {/* Footer Glow */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#00BFFF] via-[#B266FF] to-[#FF7F50]"></div>
        </div>
      </div>
    </div>
  );
};

export default RoundSelection;
