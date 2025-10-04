const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const bodyParser = require("body-parser");

let serviceAccount;
if (process.env.SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
  } catch (e) {
    try {
      const decoded = Buffer.from(process.env.SERVICE_ACCOUNT_JSON, "base64").toString("utf8");
      serviceAccount = JSON.parse(decoded);
    } catch (e2) {
      console.error("Invalid SERVICE_ACCOUNT_JSON");
      process.exit(1);
    }
  }
} else {
  serviceAccount = require("./serviceAccountKey.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://<YOUR_PROJECT_ID>.firebaseio.com"
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/resetPassword", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ success: false, error: "Missing fields" });
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { password: newPassword });
    await admin.auth().revokeRefreshTokens(user.uid);
    return res.json({ success: true });
  } catch (error) {
    console.error("reset error:", error);
    return res.status(400).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
