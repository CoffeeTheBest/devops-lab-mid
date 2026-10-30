const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Portal Server] Assignment Submission Portal running on http://localhost:${PORT}`);
  console.log(`[Portal Server] Health check available at http://localhost:${PORT}/health`);
  console.log(`[Portal Server] Submissions API at http://localhost:${PORT}/api/submissions`);
});
