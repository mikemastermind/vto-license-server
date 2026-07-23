require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, { 
  serverSelectionTimeoutMS: 5000 
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

const License = mongoose.model('License', new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  tier: String,
  status: { type: String, default: 'active' },
  customerEmail: String,
  activatedAt: Date,
  expiresAt: Date,
  deviceId: String
}));

app.get('/', (req, res) => res.send('VTO License Server is running ✅'));

app.post('/validate', async (req, res) => {
  try {
    const { licenseKey, deviceId } = req.body || {};
    if (!licenseKey) return res.json({ valid: false, error: "No key provided" });

    const license = await License.findOne({ key: licenseKey.toUpperCase().trim() });

    if (!license) return res.json({ valid: false, error: "Invalid key" });
    if (license.status !== 'active') return res.json({ valid: false, error: "Key already used" });

    if (new Date() > license.expiresAt) {
      license.status = 'expired';
      await license.save();
      return res.json({ valid: false, error: "Key expired" });
    }

    if (license.deviceId) {
      return res.json({ valid: false, error: "This key has already been redeemed" });
    }

    license.deviceId = deviceId || 'unknown';
    license.activatedAt = new Date();
    await license.save();

    res.json({ valid: true, expiresAt: license.expiresAt });
  } catch (err) {
    console.error("Validate error:", err.message);
    res.json({ valid: false, error: "Server error - Check MongoDB connection" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
