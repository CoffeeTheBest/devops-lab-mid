/**
 * Input validation for assignment submissions.
 * Enforces specific, true academic and protocol validation rules for each field.
 */

// Academic Registration Number pattern:
// Matches standard COMSATS format (e.g., SP21-BCS-042, FA20-BSE-001, SP21-BCS-001)
// and broader academic hyphenated/slashed registry structures.
const REG_NO_PATTERN = /^([a-zA-Z]{2}\d{2}-[a-zA-Z]{2,5}-\d{1,4}|[a-zA-Z0-9]{2,8}([-/][a-zA-Z0-9]{2,8}){1,3})$/i;

// Name pattern: allows letters, spaces, hyphens, periods, and apostrophes
const NAME_CHARS_PATTERN = /^[a-zA-Z\s.'-]+$/;

function isValidName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 70) return false;
  if (!NAME_CHARS_PATTERN.test(trimmed)) return false;
  const letters = trimmed.match(/[a-zA-Z]/g);
  return letters !== null && letters.length >= 2;
}

function isValidRegNo(regNo) {
  if (typeof regNo !== 'string') return false;
  const trimmed = regNo.trim();
  return REG_NO_PATTERN.test(trimmed);
}

function isValidAssignmentTitle(title) {
  if (typeof title !== 'string') return false;
  const trimmed = title.trim();
  if (trimmed.length < 3 || trimmed.length > 120) return false;
  const alphanum = trimmed.match(/[a-zA-Z0-9]/g);
  return alphanum !== null && alphanum.length >= 2;
}

function isValidUrl(urlString) {
  if (typeof urlString !== 'string' || !urlString.trim()) {
    return false;
  }
  const trimmed = urlString.trim();
  if (/\s/.test(trimmed)) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    if (!parsed.hostname || parsed.hostname.length < 1) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function validateSubmission(payload) {
  const errors = [];
  const fieldErrors = {};

  if (!payload || typeof payload !== 'object') {
    return {
      isValid: false,
      errors: ['Request payload must be a valid JSON object.'],
      fieldErrors: {}
    };
  }

  const { name, regNo, assignmentTitle, submissionUrl } = payload;

  // 1. Student Name Validation
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Student name is required.');
    fieldErrors.name = 'Student name is required.';
  } else {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      errors.push('Student name must be at least 2 characters long.');
      fieldErrors.name = 'Student name must be at least 2 characters long.';
    } else if (trimmedName.length > 70) {
      errors.push('Student name cannot exceed 70 characters.');
      fieldErrors.name = 'Student name cannot exceed 70 characters.';
    } else if (!NAME_CHARS_PATTERN.test(trimmedName)) {
      errors.push('Student name can only contain letters, spaces, hyphens, and periods.');
      fieldErrors.name = 'Student name can only contain letters, spaces, hyphens, and periods.';
    } else {
      const letters = trimmedName.match(/[a-zA-Z]/g);
      if (!letters || letters.length < 2) {
        errors.push('Student name must contain alphabetical letters.');
        fieldErrors.name = 'Student name must contain alphabetical letters.';
      }
    }
  }

  // 2. Registration Number Validation
  if (!regNo || typeof regNo !== 'string' || !regNo.trim()) {
    errors.push('Registration number is required.');
    fieldErrors.regNo = 'Registration number is required.';
  } else if (!isValidRegNo(regNo)) {
    errors.push('Invalid registration number format. Expected format: SP21-BCS-042 (e.g. [Session][Year]-[Program]-[RollNo]).');
    fieldErrors.regNo = 'Invalid registration number format. Expected format: SP21-BCS-042.';
  }

  // 3. Assignment Title Validation
  if (!assignmentTitle || typeof assignmentTitle !== 'string' || !assignmentTitle.trim()) {
    errors.push('Assignment title is required.');
    fieldErrors.assignmentTitle = 'Assignment title is required.';
  } else {
    const trimmedTitle = assignmentTitle.trim();
    if (trimmedTitle.length < 3) {
      errors.push('Assignment title must be at least 3 characters long.');
      fieldErrors.assignmentTitle = 'Assignment title must be at least 3 characters long.';
    } else if (trimmedTitle.length > 120) {
      errors.push('Assignment title cannot exceed 120 characters.');
      fieldErrors.assignmentTitle = 'Assignment title cannot exceed 120 characters.';
    } else {
      const alphanum = trimmedTitle.match(/[a-zA-Z0-9]/g);
      if (!alphanum || alphanum.length < 2) {
        errors.push('Assignment title must contain alphanumeric text.');
        fieldErrors.assignmentTitle = 'Assignment title must contain alphanumeric text.';
      }
    }
  }

  // 4. Submission URL Validation
  if (!submissionUrl || typeof submissionUrl !== 'string' || !submissionUrl.trim()) {
    errors.push('Submission URL is required.');
    fieldErrors.submissionUrl = 'Submission URL is required.';
  } else if (!isValidUrl(submissionUrl)) {
    errors.push('Invalid submission URL. Must start with http:// or https://');
    fieldErrors.submissionUrl = 'Invalid submission URL. Must start with http:// or https://';
  }

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors
  };
}

module.exports = {
  REG_NO_PATTERN,
  isValidName,
  isValidRegNo,
  isValidAssignmentTitle,
  isValidUrl,
  validateSubmission
};
