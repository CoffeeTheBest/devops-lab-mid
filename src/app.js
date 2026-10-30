const express = require('express');
const cors = require('cors');
const path = require('path');
const { validateSubmission } = require('./validator');
const { store } = require('./store');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET all submissions
app.get('/api/submissions', (req, res) => {
  const submissions = store.getAll();
  res.status(200).json({
    success: true,
    count: submissions.length,
    submissions
  });
});

// POST a new submission
app.post('/api/submissions', (req, res) => {
  const validation = validateSubmission(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: validation.errors[0],
      errors: validation.errors
    });
  }

  const { name, regNo, assignmentTitle, submissionUrl } = req.body;
  const newSubmission = store.add({ name, regNo, assignmentTitle, submissionUrl });

  return res.status(201).json({
    success: true,
    message: 'Submission successfully saved.',
    submission: newSubmission
  });
});

// Reset endpoint (useful for test environments)
app.delete('/api/submissions', (req, res) => {
  store.clear();
  res.status(200).json({ success: true, message: 'All submissions cleared.' });
});

module.exports = app;
