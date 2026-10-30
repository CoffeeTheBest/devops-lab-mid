/**
 * Input validation for assignment submissions.
 */

function isValidUrl(urlString) {
  if (typeof urlString !== 'string' || !urlString.trim()) {
    return false;
  }
  try {
    const parsed = new URL(urlString.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateSubmission(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return {
      isValid: false,
      errors: ['Request payload must be a valid JSON object.']
    };
  }

  const { name, regNo, assignmentTitle, submissionUrl } = payload;

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Student name is required.');
  }

  if (!regNo || typeof regNo !== 'string' || !regNo.trim()) {
    errors.push('Registration number is required.');
  }

  if (!assignmentTitle || typeof assignmentTitle !== 'string' || !assignmentTitle.trim()) {
    errors.push('Assignment title is required.');
  }

  if (!submissionUrl || typeof submissionUrl !== 'string' || !submissionUrl.trim()) {
    errors.push('Submission URL is required.');
  } else if (!isValidUrl(submissionUrl)) {
    errors.push('Invalid submission URL. Must start with http:// or https://');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  isValidUrl,
  validateSubmission
};
