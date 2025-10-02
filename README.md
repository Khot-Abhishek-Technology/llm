# Smart Recruitment System

An AI-powered recruitment platform that automates candidate testing, monitors integrity, and provides personalized post-test learning recommendations.

## 🚀 Overview

This system enables HR teams to create AI-generated tests, monitor candidates via real-time face recognition, and provide personalized improvement suggestions based on test performance. It combines **ML**, **GenAI**, and **Computer Vision** to streamline the hiring process while maintaining fairness and transparency.

---

## ⚙️ How It Works

### **1. Test Creation (HR Panel)**

* HR creates tests including **Aptitude** and **DSA** sections.
* Questions are **automatically generated** using the **Gemini API**, with configurable parameters (difficulty, topics, number of questions).
* Student list is uploaded, and unique email links are sent for test access.

### **2. Test Execution (Student Side)**

* Students join via their unique test link.
* Real-time monitoring via **Face-api.js** detects:

  * Multiple faces
  * Browser minimize/tab switch
  * Suspicious movements
* On detecting cheating, an **automated email alert** is sent to HR, and the student’s status is marked as **Fail**.

### **3. Post-Test Analysis**

* Results are stored with detailed metadata:

  * Time taken per question
  * DSA solution complexity
  * Attempts and accuracy
* Data is **cleaned** and fed into a **GenAI model** to generate:

  * Suggested practice questions
  * Weak topic analysis
* Students receive personalized improvement emails.

### **4. Learning & Interaction**

* **Animation-based DSA learning module** for better understanding of algorithms.
* Integrated **video call system** for direct HR–student communication.
* Automated stage-wise email notifications to both HR and students.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, Tailwind CSS
* **Backend:** Node.js, Express.js, MongoDB
* **AI/ML:** Gemini API, Custom ML Models
* **Computer Vision:** Face-api.js
* **Real-Time Communication:** WebRTC (Video Call)
* **Other:** EmailJS, JWT Authentication

---

## ✨ Key Features

✅ AI-generated Aptitude & DSA tests
✅ Real-time proctoring with cheat detection
✅ Automated email alerts for violations
✅ Detailed performance analytics
✅ Personalized AI-driven question suggestions
✅ Animated DSA learning section
✅ Built-in HR–candidate video calls

---

