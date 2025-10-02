const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const Student = require("../models/studentModel");
require("dotenv").config();

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASS || "your-app-password",
  },
});

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP to student email
router.post("/sendOTP", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find or create student
    let student = await Student.findOne({ email });
    if (!student) {
      student = new Student({ email });
    }

    student.otp = otp;
    student.otpExpiry = otpExpiry;
    await student.save();

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "SmartRecruitAI - Login OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #00BFFF, #1E90FF); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">SmartRecruitAI</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Student Portal Login</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Your Login OTP</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Use the following OTP to login to your SmartRecruitAI student account:
            </p>
            
            <div style="background: #f8f9fa; border: 2px dashed #00BFFF; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #00BFFF; font-size: 36px; margin: 0; letter-spacing: 5px; font-family: monospace;">${otp}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Important:</strong> This OTP will expire in 10 minutes. Do not share this code with anyone.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This is an automated message from SmartRecruitAI. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }
});

// Verify OTP and login
router.post("/verifyOTP", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const student = await Student.findOne({ email });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check if OTP is valid and not expired
    if (student.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (new Date() > student.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Clear OTP and mark as verified
    student.otp = undefined;
    student.otpExpiry = undefined;
    student.isVerified = true;
    student.lastLogin = new Date();
    await student.save();

    res.json({
      success: true,
      message: "Login successful",
      student: {
        id: student._id,
        email: student.email,
        name: student.name,
        isVerified: student.isVerified,
      },
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP. Please try again.",
    });
  }
});

module.exports = router;
