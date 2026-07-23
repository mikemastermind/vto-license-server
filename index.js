require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => res.send('VTO License Server is running ✅'));

// Simple in-memory licenses for testing
const licenses = new Map();

app.post('/validate', (req, res) => {
  const { licenseKey, deviceId } = req.body || {};
  
  if (!licenseKey) return res.json({ valid: false, error: "No key provided" });

  const key = licenseKey.toUpperCase().trim();

  if (key === "VTO1-TEST-ABCD-EFGH") {
    if (!licenses.has(key)) {
      licenses.set(key, { expiresAt: new Date(Date.now() + 30*24*60*60*1000), deviceId });
      return res.json({ valid: true, expiresAt: new Date(Date.now() + 30*24*60*60*1000).toISOString() });
    } else {
      return res.json({ valid: false, error: "Key already redeemed" });
    }
  }

  res.json({ valid: false, error: "Invalid key" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
