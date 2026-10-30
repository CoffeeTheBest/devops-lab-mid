const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5050;
const OUTPUT_FILE = path.join(__dirname, '..', 'test-report.json');

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /health
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'Test Report Receiver', port: PORT }));
    return;
  }

  // GET /report
  if (req.method === 'GET' && (req.url === '/report' || req.url === '/api/report')) {
    if (fs.existsSync(OUTPUT_FILE)) {
      const data = fs.readFileSync(OUTPUT_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No test-report.json has been received yet.' }));
    }
    return;
  }

  // GET /: status dashboard
  if (req.method === 'GET' && req.url === '/') {
    let reportSnippet = '<p style="color:#888;">No test reports received yet.</p>';
    if (fs.existsSync(OUTPUT_FILE)) {
      try {
        const report = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        const isPassed = report.overallStatus === 'PASSED';
        reportSnippet = `
          <div style="background:${isPassed ? '#0d2818' : '#3d0c0c'};border:1px solid ${isPassed ? '#16db65' : '#e63946'};padding:16px;border-radius:8px;margin-top:16px;">
            <h3 style="margin:0 0 8px 0;color:${isPassed ? '#16db65' : '#ff4d4d'};">Status: ${report.overallStatus}</h3>
            <p><strong>Repo:</strong> ${report.repository} (branch: <code>${report.branch}</code>)</p>
            <p><strong>Commit:</strong> <code>${report.commitSha}</code></p>
            <p><strong>Run ID:</strong> ${report.pipelineRunId}</p>
            <p><strong>Tests:</strong> Total: ${report.summary?.total} | Passed: ${report.summary?.passed} | Failed: ${report.summary?.failed}</p>
            <p><strong>Received At:</strong> ${report.executionTimestamp}</p>
          </div>
        `;
      } catch (e) {
        reportSnippet = `<p>Error loading test report: ${e.message}</p>`;
      }
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CI Test Report Receiver</title>
        <meta http-equiv="refresh" content="5">
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f1f5f9; padding: 32px; max-width: 800px; margin: 0 auto; }
          code { background: #1e293b; padding: 2px 6px; border-radius: 4px; color: #38bdf8; }
          .endpoint { background: #1e293b; padding: 12px; border-radius: 6px; font-family: monospace; margin: 12px 0; }
        </style>
      </head>
      <body>
        <h1>📡 CI Test Report Receiver</h1>
        <p>Listening on port <code>${PORT}</code>. Auto-refreshes every 5 seconds.</p>
        <div class="endpoint">POST http://localhost:${PORT}/report</div>
        <h2>Latest Test Report:</h2>
        ${reportSnippet}
      </body>
      </html>
    `);
    return;
  }

  // POST /report or POST /
  if (req.method === 'POST' && (req.url === '/report' || req.url === '/' || req.url === '/api/report')) {
    let rawBody = '';
    req.on('data', chunk => {
      rawBody += chunk;
      // Safeguard against too large payloads
      if (rawBody.length > 5 * 1024 * 1024) {
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const parsed = JSON.parse(rawBody);

        // Save formatted report to disk
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(parsed, null, 2), 'utf8');

        const timestamp = new Date().toISOString();
        const statusColor = parsed.overallStatus === 'PASSED' ? '\x1b[32m' : '\x1b[31m';
        console.log(`\n======================================================`);
        console.log(`[RECEIVER] [${timestamp}] New Test Report Received!`);
        console.log(`[RECEIVER] Repo: ${parsed.repository} | Branch: ${parsed.branch}`);
        console.log(`[RECEIVER] Commit: ${parsed.commitSha} | Run ID: ${parsed.pipelineRunId}`);
        console.log(`[RECEIVER] Status: ${statusColor}${parsed.overallStatus}\x1b[0m (Total: ${parsed.summary?.total}, Passed: ${parsed.summary?.passed}, Failed: ${parsed.summary?.failed})`);
        console.log(`[RECEIVER] Saved to: ${OUTPUT_FILE}`);
        console.log(`======================================================\n`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Test report saved successfully to test-report.json',
          savedPath: OUTPUT_FILE,
          receivedAt: timestamp,
          status: parsed.overallStatus
        }));
      } catch (err) {
        console.error('[RECEIVER] Failed to process payload:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Malformed JSON payload' }));
      }
    });
    return;
  }

  // 404 for other endpoints
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found. Use POST /report' }));
});

server.listen(PORT, () => {
  console.log(`\n============================================================`);
  console.log(`  Local CI Test Report Receiver running on:`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  Receiver Endpoint: http://localhost:${PORT}/report`);
  console.log(`  Dashboard:         http://localhost:${PORT}/`);
  console.log(`  Output file:       ${OUTPUT_FILE}`);
  console.log(`============================================================\n`);
});

module.exports = server;
