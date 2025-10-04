const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const bodyParser = require("body-parser");

let serviceAccount;
if (process.env.SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
  } catch (e) {
    try {
      const decoded = Buffer.from(process.env.SERVICE_ACCOUNT_KEY, "base64").toString("utf8");
      serviceAccount = JSON.parse(decoded);
    } catch {
      console.error("Invalid SERVICE_ACCOUNT_KEY");
      process.exit(1);
    }
  }
} else {
  serviceAccount = require("./serviceAccountKey.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Reset Password Server is Running ✅");
});

app.post("/resetPassword", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: "Email and newPassword are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: "Password must be at least 6 characters" 
      });
    }

    const user = await admin.auth().getUserByEmail(email);
    
    await admin.auth().updateUser(user.uid, { 
      password: newPassword,
      emailVerified: true
    });

    console.log(`Password updated successfully for user: ${email}`);

    return res.status(200).json({ 
      success: true, 
      message: "Password changed successfully",
      uid: user.uid
    });

  } catch (error) {
    console.error("Password reset error:", error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to reset password"
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));