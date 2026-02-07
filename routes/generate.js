const express = require('express');
const router = express.Router();
const axios = require('axios');

const GEMINI_ENDPOINT = process.env.GEMINI_ENDPOINT;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

router.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    // Adjust the body to match your Gemini provider's expected schema.
    const body = {
      prompt: prompt,
      max_tokens: 300
    };

    const response = await axios.post(GEMINI_ENDPOINT, body, {
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    return res.json(response.data);
  } catch (err) {
    console.error('Gemini call error:', err?.response?.data || err.message);
    return res.status(500).json({
      error: 'Failed to call Gemini',
      details: err?.response?.data || err.message
    });
  }
});

module.exports = router;