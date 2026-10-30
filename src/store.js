/**
 * In-memory data store for assignment submissions.
 */

class SubmissionStore {
  constructor() {
    this.submissions = [];
    this.nextId = 1;
  }

  getAll() {
    return [...this.submissions];
  }

  getById(id) {
    return this.submissions.find(item => item.id === Number(id)) || null;
  }

  add({ name, regNo, assignmentTitle, submissionUrl }) {
    const record = {
      id: this.nextId++,
      name: name.trim(),
      regNo: regNo.trim(),
      assignmentTitle: assignmentTitle.trim(),
      submissionUrl: submissionUrl.trim(),
      submittedAt: new Date().toISOString()
    };
    this.submissions.push(record);
    return record;
  }

  clear() {
    this.submissions = [];
    this.nextId = 1;
  }
}

// Singleton store instance
const store = new SubmissionStore();

module.exports = {
  SubmissionStore,
  store
};
