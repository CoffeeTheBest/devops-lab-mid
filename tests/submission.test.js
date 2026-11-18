const request = require('supertest');
const app = require('../src/app');
const { store } = require('../src/store');

describe('Assignment Submission Portal Tests', () => {
  beforeEach(() => {
    store.clear();
  });

  // Test Case 1 (Required by Lab Spec): Complete details and a valid submission URL
  test('Complete details and a valid submission URL: The submission is saved and appears in the submission list', async () => {
    const validPayload = {
      name: 'Muhammad Huzaifa',
      regNo: 'SP21-BCS-001',
      assignmentTitle: 'DevOps CI/CD Automation Lab',
      submissionUrl: 'https://github.com/huzaifa/devops-lab-mid'
    };

    // 1. Submit valid assignment
    const postResponse = await request(app)
      .post('/api/submissions')
      .send(validPayload)
      .expect(201);

    expect(postResponse.body.success).toBe(true);
    expect(postResponse.body.submission).toBeDefined();
    expect(postResponse.body.submission.id).toBeDefined();
    expect(postResponse.body.submission.name).toBe(validPayload.name);
    expect(postResponse.body.submission.regNo).toBe(validPayload.regNo);
    expect(postResponse.body.submission.assignmentTitle).toBe(validPayload.assignmentTitle);
    expect(postResponse.body.submission.submissionUrl).toBe(validPayload.submissionUrl);

    // 2. Verify submission appears in the submission list
    const getResponse = await request(app)
      .get('/api/submissions')
      .expect(200);

    expect(getResponse.body.success).toBe(true);
    expect(getResponse.body.count).toBe(1);
    expect(getResponse.body.submissions.length).toBe(1);
    expect(getResponse.body.submissions[0].regNo).toBe(validPayload.regNo);
    expect(getResponse.body.submissions[0].submissionUrl).toBe(validPayload.submissionUrl);
  });

  // Test Case 2 (Required by Lab Spec): Missing registration number
  test('Missing registration number: The submission is rejected with a validation message', async () => {
    const missingRegNoPayload = {
      name: 'Muhammad Huzaifa',
      assignmentTitle: 'DevOps CI/CD Automation Lab',
      submissionUrl: 'https://github.com/huzaifa/devops-lab-mid'
    };

    const postResponse = await request(app)
      .post('/api/submissions')
      .send(missingRegNoPayload)
      .expect(400);

    expect(postResponse.body.success).toBe(false);
    expect(postResponse.body.error).toMatch(/registration number/i);

    // Verify submission is not saved
    const getResponse = await request(app)
      .get('/api/submissions')
      .expect(200);

    expect(getResponse.body.count).toBe(0);
    expect(getResponse.body.submissions.length).toBe(0);
  });

  // Test Case 3 (Required by Lab Spec): Invalid submission URL
  test('Invalid submission URL: The submission is rejected and is not saved', async () => {
    const invalidUrlPayload = {
      name: 'Muhammad Huzaifa',
      regNo: 'SP21-BCS-001',
      assignmentTitle: 'DevOps CI/CD Automation Lab',
      submissionUrl: 'ftp://not-a-valid-http-url'
    };

    const postResponse = await request(app)
      .post('/api/submissions')
      .send(invalidUrlPayload)
      .expect(400);

    expect(postResponse.body.success).toBe(false);
    expect(postResponse.body.error).toMatch(/submission url/i);

    // Verify submission was NOT saved
    const getResponse = await request(app)
      .get('/api/submissions')
      .expect(200);

    expect(getResponse.body.count).toBe(0);
    expect(getResponse.body.submissions.length).toBe(0);
  });

  // Additional sanity check test
  test('Missing student name or assignment title is rejected', async () => {
    const missingFieldsPayload = {
      regNo: 'SP21-BCS-001',
      submissionUrl: 'https://github.com/example/assignment'
    };

    const postResponse = await request(app)
      .post('/api/submissions')
      .send(missingFieldsPayload)
      .expect(400);

    expect(postResponse.body.success).toBe(false);
    expect(postResponse.body.error).toBeDefined();
  });

  // Specific and True Validation Tests for Each Field
  describe('Specific & True Field Validation Rules', () => {
    test('Malformed registration number format is rejected', async () => {
      const invalidRegPayload = {
        name: 'Muhammad Huzaifa',
        regNo: '12345678', // Pure numbers, missing session & program
        assignmentTitle: 'DevOps CI/CD Lab',
        submissionUrl: 'https://github.com/huzaifa/devops-lab-mid'
      };

      const res = await request(app)
        .post('/api/submissions')
        .send(invalidRegPayload)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/registration number format/i);
    });

    test('Invalid student name containing digits or symbols is rejected', async () => {
      const invalidNamePayload = {
        name: 'Huzaifa123!!', // Digits and symbols
        regNo: 'SP21-BCS-042',
        assignmentTitle: 'DevOps CI/CD Lab',
        submissionUrl: 'https://github.com/huzaifa/devops-lab-mid'
      };

      const res = await request(app)
        .post('/api/submissions')
        .send(invalidNamePayload)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/student name/i);
    });

    test('Assignment title with insufficient characters is rejected', async () => {
      const invalidTitlePayload = {
        name: 'Muhammad Huzaifa',
        regNo: 'SP21-BCS-042',
        assignmentTitle: 'ab', // Too short (min 3 chars)
        submissionUrl: 'https://github.com/huzaifa/devops-lab-mid'
      };

      const res = await request(app)
        .post('/api/submissions')
        .send(invalidTitlePayload)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/assignment title/i);
    });

    test('Submission URL with spaces or missing domain is rejected', async () => {
      const invalidUrlPayload = {
        name: 'Muhammad Huzaifa',
        regNo: 'SP21-BCS-042',
        assignmentTitle: 'DevOps CI/CD Lab',
        submissionUrl: 'https://github.com/invalid path with spaces'
      };

      const res = await request(app)
        .post('/api/submissions')
        .send(invalidUrlPayload)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/submission url/i);
    });
  });
});
