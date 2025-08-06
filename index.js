require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const OTP_SESSION_STORE = {}; // In-memory storage (use DB in real apps)

// ✅ SEND OTP via SMS
app.post('/send-otp', async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, message: "Phone number is required." });
    }

    try {
        const response = await axios.get(`https://2factor.in/API/V1/${process.env.API_KEY}/SMS/${phone}/${templateName}`);

        console.log("2Factor Response:", response.data);

        if (response.data.Status === "Success") {
            const sessionId = response.data.Details;
            OTP_SESSION_STORE[phone] = sessionId;
            return res.status(200).json({ success: true, message: "OTP sent via SMS", sessionId });
        } else {
            return res.status(400).json({ success: false, message: response.data.Details });
        }
    } catch (error) {
        console.error("Send OTP Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
});

// ✅ VERIFY OTP
app.post('/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ success: false, message: "Phone and OTP are required." });
    }

    const sessionId = OTP_SESSION_STORE[phone];

    if (!sessionId) {
        return res.status(400).json({ success: false, message: "No OTP session found. Request OTP again." });
    }

    try {
        const response = await axios.get(`https://2factor.in/API/V1/${process.env.API_KEY}/SMS/VERIFY/${sessionId}/${otp}`);

        console.log("Verify Response:", response.data);

        if (response.data.Status === "Success") {
            return res.status(200).json({ success: true, message: "OTP verified successfully" });
        } else {
            return res.status(400).json({ success: false, message: response.data.Details });
        }
    } catch (error) {
        console.error("Verify OTP Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Failed to verify OTP" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
