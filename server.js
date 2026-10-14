const express = require('express');
const multer = require('multer');
const https = require('https');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// আপনার গুগল অ্যাপস স্ক্রিপ্ট ওয়েব অ্যাপ ইউআরএল এখানে দিন
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwD1BsLtupiVggz4p5P3b9rh7OFUDf4RFP01gg8iHb-oLlavPhO6NACGTozLsInPSo/exec";

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const base64Data = req.file.buffer.toString('base64');
    const payload = JSON.stringify({
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      base64: base64Data
    });

    const urlObj = new URL(GOOGLE_APPS_SCRIPT_URL);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const externalReq = https.request(options, (externalRes) => {
      let data = '';
      externalRes.on('data', (chunk) => { data += chunk; });
      externalRes.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.status === 'success') {
            res.json({ success: true });
          } else {
            res.status(500).json({ success: false, error: result.message || 'Apps Script Error' });
          }
        } catch (e) {
          res.json({ success: true }); // ধরে নেওয়া হলো সফলভাবে গেছে
        }
      });
    });

    externalReq.on('error', (error) => {
      res.status(500).json({ success: false, error: error.message });
    });

    externalReq.write(payload);
    externalReq.end();

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
