const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const TEST_RESULTS_FILE = path.join(__dirname, '..', 'test-results.json');
const REPORT_OUTPUT_FILE = path.join(__dirname, '..', 'test-report.json');

function parseJestResults() {
  if (!fs.existsSync(TEST_RESULTS_FILE)) {
    console.error(`[format-report] Test results file not found at ${TEST_RESULTS_FILE}`);
    return null;
  }

  const raw = fs.readFileSync(TEST_RESULTS_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('[format-report] Failed to parse test results JSON:', err.message);
    return null;
  }
}

function buildReport(jestData) {
  const tests = [];
  let total = 0;
  let passed = 0;
  let failed = 0;

  if (jestData && Array.isArray(jestData.testResults)) {
    for (const suite of jestData.testResults) {
      if (Array.isArray(suite.assertionResults)) {
        for (const assert of suite.assertionResults) {
          total++;
          const isPassed = assert.status === 'passed';
          if (isPassed) {
            passed++;
          } else {
            failed++;
          }

          tests.push({
            name: assert.fullName || assert.title,
            result: assert.status,
            failureMessage: (assert.failureMessages && assert.failureMessages.length > 0)
              ? assert.failureMessages.join('\n')
              : null,
            durationMs: assert.duration || 0
          });
        }
      }
    }
  }

  const overallStatus = (failed === 0 && total > 0 && jestData?.success) ? 'PASSED' : 'FAILED';

  return {
    repository: process.env.GITHUB_REPOSITORY || 'local/assignment-submission-portal',
    branch: process.env.GITHUB_REF_NAME || 'main',
    commitSha: process.env.GITHUB_SHA || 'local-dev-commit',
    pipelineRunId: process.env.GITHUB_RUN_ID || `local-run-${Date.now()}`,
    executionTimestamp: new Date().toISOString(),
    overallStatus,
    summary: {
      total,
      passed,
      failed
    },
    tests
  };
}

async function sendToReceiver(report, targetUrl) {
  if (!targetUrl) {
    console.log('[format-report] RECEIVER_URL not set. Skipping remote HTTP delivery.');
    return;
  }

  console.log(`[format-report] Sending test report to receiver at: ${targetUrl}`);
  const payload = JSON.stringify(report);
  const parsedUrl = new URL(targetUrl);
  const isHttps = parsedUrl.protocol === 'https:';
  const client = isHttps ? https : http;

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (isHttps ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    },
    timeout: 10000
  };

  return new Promise((resolve) => {
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`[format-report] Receiver responded with HTTP ${res.statusCode}: ${body.trim()}`);
        resolve(true);
      });
    });

    req.on('error', (err) => {
      console.error(`[format-report] Failed to send report to receiver: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.error('[format-report] Request to receiver timed out after 10s.');
      req.destroy();
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  const jestData = parseJestResults();
  const report = buildReport(jestData);

  // Always save local copy of test-report.json
  fs.writeFileSync(REPORT_OUTPUT_FILE, JSON.stringify(report, null, 2), 'utf8');
  console.log(`[format-report] Generated ${REPORT_OUTPUT_FILE}`);
  console.log(`[format-report] Status: ${report.overallStatus} | Total: ${report.summary.total} | Passed: ${report.summary.passed} | Failed: ${report.summary.failed}`);

  // Send to receiver if configured
  const receiverUrl = process.env.RECEIVER_URL || process.env.REPORT_RECEIVER_URL;
  if (receiverUrl) {
    await sendToReceiver(report, receiverUrl);
  }
}

main().catch(err => {
  console.error('[format-report] Fatal error:', err);
  process.exit(1);
});
