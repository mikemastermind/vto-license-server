require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB OK'))
  .catch(e => console.log('MongoDB Error', e.message));

const License = mongoose.model('License', new mongoose.Schema({
  key: String,
  tier: String,
  status: String,
  expiresAt: Date,
  deviceId: String
}));

app.get('/', (req, res) => res.send('OK'));

app.post('/validate', async (req, res) => {
  try {
    const { licenseKey } = req.body;
    if (!licenseKey) return res.json({ valid: false, error: "No key" });

    // For testing - accept test key
    if (licenseKey === "VTO1-TEST-ABCD-EFGH") {
      return res.json({ 
        valid: true, 
        expiresAt: new Date(Date.now() + 1000*60*60*24*30).toISOString() 
      });
    }

    res.json({ valid: false, error: "Invalid key" });
  } catch (e) {
    console.error(e);
    res.json({ valid: false, error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running'));
