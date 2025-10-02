import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import axios from "axios";

const CandidateUpload = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const candidatesPerPage = 15;
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [candidateData, setCandidateData] = useState([]);
  const [candidateEmails, setCandidateEmails] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (
        selectedFile.type !==
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
        selectedFile.type !== "application/vnd.ms-excel"
      ) {
        setUploadStatus("Please upload a valid Excel file (.xlsx, .xls)");
        return;
      }
      setFile(selectedFile);
      setUploadStatus(`File selected: ${selectedFile.name}`);

      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const parsedData = jsonData.map((row) => ({
          name: row["Name"] || "N/A",
          email: row["Email"] || "N/A",
        }));

        const emails = jsonData
          .map((row) => row["Email"])
          .filter((email) => email);

        setCandidateEmails(emails);
        setCandidateData(parsedData);
        setUploadStatus("File uploaded successfully");
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleSubmit = async () => {
    try {
      console.log("Submitting candidate data:", candidateData);
      console.log("Submitting candidate emails:", candidateEmails);

      const response = await axios.post(`${BACKEND_URL}/updateUser`, {
        userId: localStorage.getItem("userId"),
        candidateData,
      });

      if (response.status === 200) {
        console.log("Candidates successfully updated:", response.data);
        setIsSubmitted(true);
        setUploadStatus("Candidates submitted successfully!");
        setTimeout(() => {
          navigate("/roundSelection");
        }, 1200);
      }
    } catch (error) {
      console.error("Error updating candidates:", error);
      setUploadStatus("Failed to submit candidates. Please try again.");
    }
  };

  const indexOfLastCandidate = currentPage * candidatesPerPage;
  const indexOfFirstCandidate = indexOfLastCandidate - candidatesPerPage;
  const currentCandidates = candidateData.slice(
    indexOfFirstCandidate,
    indexOfLastCandidate
  );

  const totalPages = Math.ceil(candidateData.length / candidatesPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="overflow-hidden">
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] p-6">
        <div className="w-full max-w-3xl bg-[#1A1A1A] rounded-xl border border-[#333333] overflow-hidden relative">
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00BFFF] to-[#1E90FF]">
                Candidate Shortlist Upload
              </span>
            </h1>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Instructions */}
            <div className="bg-[#222222] border border-[#333333] p-4 rounded-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#00FF99] to-transparent"></div>
              <h3 className="text-base font-bold mb-2 text-[#00FF99] flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="#00FF99"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Instructions for Recruiters:
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300">
                <li>
                  Prepare an Excel file with these columns:
                  <ul className="list-[circle] pl-5 mt-1 text-gray-400">
                    <li>Name (Candidate's full name)</li>
                    <li>Email (Candidate's contact email)</li>
                  </ul>
                </li>
                <li>Ensure column names match the required format</li>
                <li>Upload only .xlsx or .xls files</li>
              </ul>
            </div>

            {/* File Upload */}
            <div className="relative group">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div
                className={`w-full p-5 border-2 border-dashed rounded-lg text-center transition-all duration-300 ${
                  file
                    ? "border-[#00BFFF] shadow-[0_0_15px_#00BFFF] bg-[#0d2d39]"
                    : "border-[#444444] group-hover:border-[#00BFFF] group-hover:shadow-[0_0_15px_#00BFFF] bg-[#222222]"
                }`}
              >
                <span className="text-gray-300 font-medium flex items-center justify-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={file ? "#00BFFF" : "#999999"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-all duration-300 ${
                      file ? "drop-shadow-[0_0_8px_#00BFFF]" : ""
                    }`}
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                  {file ? file.name : "Click to Upload Excel File"}
                </span>
              </div>
            </div>

            {/* Status */}
            {uploadStatus && (
              <p
                className={`text-center p-3 rounded-lg text-sm font-medium ${
                  uploadStatus.includes("successfully")
                    ? "bg-[#0d391d] text-[#00FF99] border border-[#008855] shadow-[0_0_10px_#00FF99]"
                    : "bg-[#390d0d] text-[#FF5555] border border-[#883333] shadow-[0_0_10px_#FF3333]"
                }`}
              >
                {uploadStatus}
              </p>
            )}

            {/* Table */}
            {candidateData.length > 0 && (
              <>
                <div className="overflow-x-auto rounded-lg border border-[#333333]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#222222] text-gray-300">
                        <th className="p-3 text-left border-b border-[#333333]">
                          <div className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-2 text-[#00FF99]"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                            </svg>
                            Name
                          </div>
                        </th>
                        <th className="p-3 text-left border-b border-[#333333]">
                          <div className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-2 text-[#B266FF]"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            Email
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentCandidates.map((candidate, index) => (
                        <tr
                          key={index}
                          className="hover:bg-[#222222] transition-colors duration-200 border-b border-[#333333] last:border-0"
                        >
                          <td className="p-3 text-gray-300">
                            {candidate.name}
                          </td>
                          <td className="p-3 text-gray-400">
                            {candidate.email}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4 text-sm">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg flex items-center transition-all ${
                      currentPage === 1
                        ? "bg-[#333333] text-gray-500 cursor-not-allowed"
                        : "bg-[#222222] text-white border border-[#444444] hover:bg-[#2a2a2a] hover:border-[#00BFFF] hover:shadow-[0_0_10px_#00BFFF]"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Previous
                  </button>
                  <span className="text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg flex items-center transition-all ${
                      currentPage === totalPages
                        ? "bg-[#333333] text-gray-500 cursor-not-allowed"
                        : "bg-[#222222] text-white border border-[#444444] hover:bg-[#2a2a2a] hover:border-[#00BFFF] hover:shadow-[0_0_10px_#00BFFF]"
                    }`}
                  >
                    Next
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 ml-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {/* Submit */}
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitted}
                    className={`px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 flex items-center ${
                      isSubmitted
                        ? "bg-gray-700 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#00BFFF] to-[#1E90FF] hover:from-[#00a5e0] hover:to-[#1a7fcc] hover:shadow-[0_0_25px_#00BFFF] transform hover:scale-[1.02]"
                    }`}
                  >
                    {isSubmitted ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Submitted
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Submit Candidates
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer Glow */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#00BFFF] via-[#B266FF] to-[#FF7F50]"></div>
        </div>
      </div>
    </div>
  );
};

export default CandidateUpload;
