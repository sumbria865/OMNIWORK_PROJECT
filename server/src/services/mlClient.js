/**
 * OmniWork — ML Service Client
 * Drop this file into your Express project (e.g. src/services/mlClient.js)
 * and call it from any route that needs ML predictions.
 *
 * Requires: axios  →  npm install axios
 * Set ML_SERVICE_URL in your Express .env  (default: http://localhost:5001)
 */

const axios = require("axios");

const ML_BASE = process.env.ML_SERVICE_URL || "http://localhost:5001";

const mlClient = axios.create({
  baseURL: ML_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. RESUME PARSER
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Parse a resume file and get auto-fill data for the employee form.
 * @param {Buffer} fileBuffer  - file contents
 * @param {string} filename    - original filename (e.g. "john_doe.pdf")
 * @returns {Promise<Object>}  - { autofill, skills_by_category, ... }
 *
 * Usage in Express route (with multer):
 *   const result = await mlService.parseResume(req.file.buffer, req.file.originalname);
 */
async function parseResume(fileBuffer, filename) {
  const FormData = require("form-data");
  const form = new FormData();
  form.append("file", fileBuffer, filename);

  const res = await axios.post(`${ML_BASE}/api/ml/resume/parse`, form, {
    headers: form.getHeaders(),
    timeout: 30000,
  });
  return res.data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TASK PRIORITY PREDICTOR
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Predict priority level for a new task.
 * @param {Object} taskData
 * @param {number} taskData.deadline_days          - days until due
 * @param {number} taskData.estimated_hours
 * @param {string} taskData.task_type              - bug|feature|research|devops|qa
 * @param {number} [taskData.num_dependencies]
 * @param {number} [taskData.assignee_current_load]
 * @param {number} [taskData.project_criticality]  - 1-4
 * @returns {Promise<Object>} - { priority_label, priority_code, confidence_pct, recommendation }
 *
 * Example Express integration:
 *   router.post("/tasks", async (req, res) => {
 *     const priority = await mlService.predictTaskPriority({
 *       deadline_days: daysBetween(new Date(), req.body.dueDate),
 *       estimated_hours: req.body.estimatedHours,
 *       task_type: req.body.type,
 *       project_criticality: project.criticality,
 *     });
 *     const task = await Task.create({ ...req.body, mlPriority: priority.priority_label });
 *     res.json({ task, mlInsight: priority });
 *   });
 */
async function predictTaskPriority(taskData) {
  const res = await mlClient.post("/api/ml/task/predict-priority", taskData);
  return res.data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. PROJECT DELAY PREDICTOR
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Predict whether a project will be delayed.
 * @param {Object} projectData
 * @param {number} projectData.total_tasks
 * @param {number} projectData.completed_tasks
 * @param {number} projectData.team_size
 * @param {number} projectData.deadline_days_remaining
 * @param {number} [projectData.num_blockers]
 * @param {number} [projectData.budget_utilization_pct]  - 1.0 = on budget
 * @param {number} [projectData.complexity_score]        - 1-10
 * @returns {Promise<Object>} - { status_label, confidence_pct, risk_factors, recommendation }
 *
 * Example — call this in a cron job and store result in MongoDB:
 *   const delay = await mlService.predictProjectDelay({ ... });
 *   await Project.findByIdAndUpdate(projectId, { mlStatus: delay.status_label });
 */
async function predictProjectDelay(projectData) {
  const res = await mlClient.post("/api/ml/project/predict-delay", projectData);
  return res.data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. EMPLOYEE PRODUCTIVITY SCORER
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Generate a productivity score for one employee.
 * @param {Object} empData
 * @param {number} empData.attendance_pct
 * @param {number} empData.tasks_completed_monthly
 * @param {number} empData.tasks_assigned_monthly
 * @param {number} empData.on_time_delivery_pct
 * @param {number} [empData.peer_review_score]   - 1-5
 * @param {number} [empData.bug_rate]            - 0-1
 * @returns {Promise<Object>} - { band_label, score, strengths, improvement_areas }
 */
async function scoreProductivity(empData) {
  const res = await mlClient.post("/api/ml/productivity/score", empData);
  return res.data.data;
}

/**
 * Score multiple employees in one call (max 200).
 * @param {Array<Object>} employees  - each must have employee_id + fields above
 * @returns {Promise<Object>} - { processed, failed, data: [...] }
 */
async function scoreProductivityBatch(employees) {
  const res = await mlClient.post("/api/ml/productivity/score-batch", { employees });
  return res.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SMART LEAVE APPROVAL SUGGESTER
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Get an ML-powered approve/reject suggestion for a leave request.
 * @param {Object} leaveData
 * @param {number} leaveData.team_size
 * @param {number} leaveData.team_on_leave_count
 * @param {number} leaveData.days_until_deadline
 * @param {number} leaveData.request_duration_days
 * @param {number} leaveData.employee_leave_balance
 * @param {string} [leaveData.project_phase]             - planning|development|testing|deployment|maintenance
 * @param {number} [leaveData.advance_notice_days]
 * @param {number} [leaveData.employee_performance_band] - 0-3
 * @returns {Promise<Object>} - { suggestion_label, confidence_pct, conditions, recommendation }
 *
 * Example — attach to leave request creation:
 *   const suggestion = await mlService.suggestLeaveApproval({ ... });
 *   await LeaveRequest.create({ ...req.body, mlSuggestion: suggestion.suggestion_label });
 */
async function suggestLeaveApproval(leaveData) {
  const res = await mlClient.post("/api/ml/leave/suggest", leaveData);
  return res.data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────────────────────
async function healthCheck() {
  try {
    const res = await mlClient.get("/health");
    return res.data;
  } catch {
    return { status: "unreachable" };
  }
}

module.exports = {
  parseResume,
  predictTaskPriority,
  predictProjectDelay,
  scoreProductivity,
  scoreProductivityBatch,
  suggestLeaveApproval,
  healthCheck,
};