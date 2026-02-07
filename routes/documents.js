const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const axios = require('axios');

const auth = require('../middleware/auth');
const Document = require('../models/Document');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Helper to call Gemini (Generative AI) endpoint
async function callGemini(prompt, options = {}) {
  const endpoint = process.env.GEMINI_ENDPOINT;
  const key = process.env.GEMINI_API_KEY;
  if (!endpoint || !key) throw new Error('Gemini endpoint or API key not configured');

  // Generic body — many Gemini/Generative endpoint variants accept different shapes.
  // If your endpoint expects { prompt: ... } or { input: ... } adapt here.
  const body = {
    // adjust these fields depending on your endpoint's schema
    prompt: prompt,
    max_output_tokens: options.max_tokens || 1000,
    temperature: options.temperature ?? 0.2
  };

  // Send request. Some deployments require Authorization: Bearer <token>, others x-api-key.
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`
    // or: 'x-api-key': key
  };

  const res = await axios.post(endpoint, body, { headers, timeout: 120000 });
  // Try to return whichever field likely contains the text result:
  // - If your endpoint returns { candidates: [{ output: "..." }] } or { output: "..." } or { generations: [...] }
  const data = res.data;
  // A few fallbacks to find text:
  if (data?.candidates && Array.isArray(data.candidates) && data.candidates[0]?.output) {
    return data.candidates[0].output;
  }
  if (data?.output) return data.output;
  if (data?.generations && Array.isArray(data.generations) && data.generations[0]?.text) {
    return data.generations[0].text;
  }
  if (typeof data === 'string') return data;
  return JSON.stringify(data);
}

// upload PDF
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text || '';
    const doc = await Document.create({
      user: req.user.id,
      title: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      textContent: text
    });
    res.json({ doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// list user documents
router.get('/', auth, async (req, res) => {
  const docs = await Document.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json({ docs });
});

// get document details
router.get('/:id', auth, async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json({ doc });
});

// AI actions: summarize | explain | flashcards | quizzes
router.post('/:id/action', auth, async (req, res) => {
  try {
    const { action, params } = req.body;
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Doc not found' });

    // Truncate long inputs to avoid huge requests
    const text = doc.textContent.slice(0, 20000); // adjust as needed and as the endpoint allows

    let prompt = '';
    if (action === 'summarize') {
      prompt = `Summarize the following academic text into concise student-friendly bullet points (3–6). Keep aligned to learning outcomes:\n\n${text}`;
    } else if (action === 'explain') {
      prompt = `Explain the key concepts from the following academic text to high-school students. Use examples and step-by-step reasoning:\n\n${text}`;
    } else if (action === 'flashcards') {
      prompt = `Extract 8 key terms from the passage and give 1-2 sentence definitions. Return JSON array like [{ "term": "", "definition": "" }]\n\n${text}`;
    } else if (action === 'quizzes') {
      prompt = `Create 3 higher-order (Application or Synthesis) questions based on the text. For each, return JSON object with fields: type, question, answer, hint. Return a JSON array.\n\n${text}`;
    } else {
      return res.status(400).json({ message: 'Unknown action' });
    }

    const resultText = await callGemini(prompt, { max_tokens: 1200, temperature: 0.2 });

    // Try to parse JSON for flashcards/quizzes
    if (action === 'flashcards' || action === 'quizzes') {
      try {
        const start = resultText.indexOf('[');
        const end = resultText.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
          const jsonText = resultText.slice(start, end + 1);
          const parsed = JSON.parse(jsonText);
          return res.json({ data: parsed });
        }
      } catch (e) {
        // parsing failed — continue to return raw text
      }
    }

    return res.json({ data: resultText });
  } catch (err) {
    console.error('AI action error', (err.response && err.response.data) ? err.response.data : err.message);
    res.status(500).json({ message: 'AI action failed', details: err.message });
  }
});

// AI chat using document context + user message
router.post('/:id/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Doc not found' });

    const context = doc.textContent.slice(0, 15000);
    const prompt = `You are an educational assistant. Use the following document context to answer the user's question, prefer citing the document and provide step-by-step reasoning:\n\nDocument:\n${context}\n\nUser question: ${message}`;

    const answer = await callGemini(prompt, { max_tokens: 800, temperature: 0.2 });
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Chat failed', details: err.message });
  }
});

module.exports = router;