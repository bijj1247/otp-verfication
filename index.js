require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173', // ✅ Your frontend URL
  credentials: true               
}));
app.use(express.json());
app.use(cookieParser());

// ✅ SEND OTP
app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, message: "Phone number is required." });
  }
  console.log("Template Name:", process.env.templateName);
  try {
    const response = await axios.get(
      `https://2factor.in/API/V1/${process.env.API_KEY}/SMS/${phone}/AUTOGEN/${process.env.templateName}`

    );

    if (response.data.Status === "Success") {
      const sessionId = response.data.Details;
      res.cookie('otpSessionId', sessionId, {
        httpOnly: true,
        secure: false, 
        sameSite: 'Lax',
        maxAge: 5 * 60 * 1000 
      });

      return res.status(200).json({ success: true, message: "OTP sent via SMS" });
    } else {
      return res.status(400).json({ success: false, message: response.data.Details });
    }
  } catch (error) {
    console.error("Send OTP Error:", error.response?.data || error.message);
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
});

app.post('/verify-otp', async (req, res) => {
  const { otp } = req.body;
  const sessionId = req.cookies.otpSessionId;

  if (!otp || !sessionId) {
    return res.status(400).json({ success: false, message: "OTP or session missing." });
  }

  try {
    const response = await axios.get(
      `https://2factor.in/API/V1/${process.env.API_KEY}/SMS/VERIFY/${sessionId}/${otp}`
    );

    if (response.data.Status === "Success") {
      res.clearCookie('otpSessionId');
      return res.status(200).json({ success: true, message: "OTP verified successfully" });
    } else {
      return res.status(400).json({ success: false, message: response.data.Details });
    }
  } catch (error) {
    console.error("Verify OTP Error:", error.response?.data || error.message);
    return res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
});

app.listen(3000, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
