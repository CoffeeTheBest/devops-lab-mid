const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const REPORT_FILE = path.join(__dirname, '..', 'test-report.json');

async function sendEmail() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const to = process.env.EMAIL_TO || process.env.NOTIFICATION_EMAIL;

  if (!user || !pass || !to) {
    console.log('[send-email] EMAIL_USER, EMAIL_PASS, or EMAIL_TO not configured.');
    console.log('[send-email] To enable email notifications, configure these secrets in your GitHub repository.');
    return;
  }

  if (!fs.existsSync(REPORT_FILE)) {
    console.error(`[send-email] Test report file not found at ${REPORT_FILE}`);
    return;
  }

  const report = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
  const isPassed = report.overallStatus === 'PASSED';
  const statusEmoji = isPassed ? '✅' : '❌';

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user, pass }
  });

  const testRows = (report.tests || []).map(t => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${t.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: ${t.result === 'passed' ? '#2e7d32' : '#d32f2f'};">
        ${t.result.toUpperCase()}
      </td>
      <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; font-size: 12px; color: #666;">
        ${t.failureMessage ? t.failureMessage.replace(/\n/g, '<br/>') : 'None'}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #333;">
      <h2 style="color: ${isPassed ? '#2e7d32' : '#d32f2f'};">
        ${statusEmoji} DevOps CI Test Report: ${report.overallStatus}
      </h2>
      <p>Automated test report for assignment submission portal.</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 6px; font-weight: bold;">Repository:</td><td>${report.repository}</td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Branch:</td><td>${report.branch}</td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Commit SHA:</td><td><code>${report.commitSha}</code></td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Pipeline Run ID:</td><td>${report.pipelineRunId}</td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Execution Time:</td><td>${report.executionTimestamp}</td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Summary:</td><td><strong>${report.summary.passed}/${report.summary.total} Passed</strong> (${report.summary.failed} Failed)</td></tr>
      </table>

      <h3>Individual Test Results</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Test Case</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Result</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Details</th>
          </tr>
        </thead>
        <tbody>
          ${testRows}
        </tbody>
      </table>
      <p style="font-size: 12px; color: #888;">Generated automatically by DevOps CI/CD pipeline.</p>
    </div>
  `;

  const mailOptions = {
    from: `"DevOps CI Reporter" <${user}>`,
    to,
    subject: `${statusEmoji} [CI ${report.overallStatus}] ${report.repository} (${report.branch} - ${report.commitSha.slice(0, 7)})`,
    html: htmlContent,
    attachments: [
      {
        filename: 'test-report.json',
        content: JSON.stringify(report, null, 2),
        contentType: 'application/json'
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[send-email] Email report successfully sent to ${to}. MessageId: ${info.messageId}`);
  } catch (err) {
    console.error(`[send-email] Failed to send email report: ${err.message}`);
  }
}

sendEmail().catch(err => {
  console.error('[send-email] Unexpected error:', err);
});
