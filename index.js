require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => res.send('VTO License Server is running ✅'));

// Test keys (add more as needed)
const validTestKeys = new Set([
  "VTO1-TEST-ABCD-EFGH",
  "VTO1-TEST-9876-WXYZ",
  "VTO1-TEST-NEW-1234"
]);

app.post('/validate', (req, res) => {
  const { licenseKey } = req.body || {};
  
  if (!licenseKey) {
    return res.json({ valid: false, error: "No key provided" });
  }

  const key = licenseKey.toUpperCase().trim();

  if (validTestKeys.has(key) || key.startsWith("VTO1-TEST-")) {
    res.json({ 
      valid: true, 
      expiresAt: new Date(Date.now() + 30*24*60*60*1000).toISOString() 
    });
  } else {
    res.json({ valid: false, error: "Invalid or already used key" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
