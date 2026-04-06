# OmniWork ML Service

A standalone Flask microservice that adds 5 ML-powered features to your Node.js + Express + MongoDB backend.

---

## Features

| Feature | Endpoint | Model |
|---|---|---|
| Resume Parser | `POST /api/ml/resume/parse` | spaCy NER + regex |
| Task Priority Predictor | `POST /api/ml/task/predict-priority` | Random Forest (93% acc) |
| Project Delay Predictor | `POST /api/ml/project/predict-delay` | Gradient Boosting (88% acc) |
| Productivity Scorer | `POST /api/ml/productivity/score` | Random Forest (82% acc) |
| Leave Approval Suggester | `POST /api/ml/leave/suggest` | Gradient Boosting (88% acc) |

---

## Quick Start

```bash
cd ml-service
chmod +x setup.sh
./setup.sh          # installs deps + trains models + starts server
```

Server runs on **http://localhost:5001**

---

## Manual Setup

```bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# 3. Train all models
python -m src.training.train_task
python -m src.training.train_project
python -m src.training.train_productivity
python -m src.training.train_leave
python -m src.training.train_resume

# 4. Start server
python src/app.py
```

---

## Docker

```bash
docker build -t omniwork-ml .
docker run -d -p 5001:5001 --env-file .env omniwork-ml
```

Or with docker-compose (add to your existing compose file):

```yaml
ml-service:
  build: ./ml-service
  ports:
    - "5001:5001"
  env_file:
    - ./ml-service/.env
  restart: unless-stopped
```

---

## Integrating with Express

Copy `mlClient.js` into your Express project:

```bash
cp mlClient.js ../src/services/mlClient.js
npm install axios form-data
```

Add to your Express `.env`:
```
ML_SERVICE_URL=http://localhost:5001
```

### Usage Examples

**1. Resume Parser (with multer)**
```js
const mlService = require('./services/mlClient');

router.post('/employees/upload-resume', upload.single('resume'), async (req, res) => {
  const parsed = await mlService.parseResume(req.file.buffer, req.file.originalname);
  // parsed.autofill → { name, email, phone, skills, experience_years, ... }
  res.json({ autofill: parsed.autofill });
});
```

**2. Task Priority on Task Creation**
```js
router.post('/tasks', async (req, res) => {
  const dueDate = new Date(req.body.dueDate);
  const deadlineDays = Math.ceil((dueDate - new Date()) / 86400000);

  const priority = await mlService.predictTaskPriority({
    deadline_days: deadlineDays,
    estimated_hours: req.body.estimatedHours,
    task_type: req.body.type,           // bug | feature | research | devops | qa
    project_criticality: req.body.projectCriticality,
  });

  const task = await Task.create({
    ...req.body,
    mlPriority: priority.priority_label,
    mlConfidence: priority.confidence_pct,
  });

  res.json({ task, mlInsight: priority });
});
```

**3. Project Delay Check (cron job)**
```js
const cron = require('node-cron');

cron.schedule('0 9 * * *', async () => {
  const projects = await Project.find({ status: 'active' });
  for (const p of projects) {
    const delay = await mlService.predictProjectDelay({
      total_tasks: p.totalTasks,
      completed_tasks: p.completedTasks,
      team_size: p.teamMembers.length,
      deadline_days_remaining: Math.ceil((p.deadline - new Date()) / 86400000),
      num_blockers: p.blockers.length,
    });
    await Project.findByIdAndUpdate(p._id, { mlStatus: delay.status_label });
  }
});
```

**4. Productivity Score (monthly report)**
```js
router.get('/employees/:id/productivity', async (req, res) => {
  const emp = await Employee.findById(req.params.id).populate('tasks');
  const thisMonth = emp.tasks.filter(t => isThisMonth(t.completedAt));

  const score = await mlService.scoreProductivity({
    attendance_pct: emp.attendanceThisMonth,
    tasks_completed_monthly: thisMonth.filter(t => t.status === 'done').length,
    tasks_assigned_monthly: emp.tasks.filter(t => isThisMonth(t.assignedAt)).length,
    on_time_delivery_pct: emp.onTimeRate,
    peer_review_score: emp.avgPeerScore,
  });

  res.json(score);
});
```

**5. Leave Approval Suggestion**
```js
router.post('/leave-requests', async (req, res) => {
  const team = await Team.findById(req.body.teamId).populate('members');
  const onLeave = team.members.filter(m => m.currentlyOnLeave).length;
  const nextDeadline = await Project.findNextDeadline(req.body.teamId);

  const suggestion = await mlService.suggestLeaveApproval({
    team_size: team.members.length,
    team_on_leave_count: onLeave,
    days_until_deadline: Math.ceil((nextDeadline - new Date()) / 86400000),
    request_duration_days: req.body.durationDays,
    employee_leave_balance: req.user.leaveBalance,
    project_phase: req.body.projectPhase,
    advance_notice_days: Math.ceil((new Date(req.body.startDate) - new Date()) / 86400000),
  });

  const leaveReq = await LeaveRequest.create({
    ...req.body,
    mlSuggestion: suggestion.suggestion_label,
    mlConditions: suggestion.conditions,
  });

  res.json({ leaveRequest: leaveReq, mlSuggestion: suggestion });
});
```

---

## API Reference

### Health Check
```
GET /health
→ { "status": "ok", "service": "omniwork-ml" }
```

### Get schema for any endpoint
```
GET /api/ml/task/schema
GET /api/ml/project/schema
GET /api/ml/productivity/schema
GET /api/ml/leave/schema
```

---

## Project Structure

```
ml-service/
├── src/
│   ├── app.py                    ← Flask entry point
│   ├── models/                   ← Trained .pkl files (auto-generated)
│   │   ├── task_priority.pkl
│   │   ├── task_type_encoder.pkl
│   │   ├── project_delay.pkl
│   │   ├── project_delay_scaler.pkl
│   │   ├── productivity.pkl
│   │   ├── productivity_scaler.pkl
│   │   ├── leave_approval.pkl
│   │   ├── leave_scaler.pkl
│   │   ├── phase_encoder.pkl
│   │   └── resume_parser.pkl
│   ├── routes/                   ← Flask blueprints
│   │   ├── resume.py
│   │   ├── task.py
│   │   ├── project.py
│   │   ├── productivity.py
│   │   └── leave.py
│   ├── services/                 ← ML inference logic
│   │   ├── resume_parser.py
│   │   ├── task_predictor.py
│   │   ├── project_predictor.py
│   │   ├── productivity_scorer.py
│   │   └── leave_predictor.py
│   └── training/                 ← Model training scripts
│       ├── train_task.py
│       ├── train_project.py
│       ├── train_productivity.py
│       ├── train_leave.py
│       └── train_resume.py
├── mlClient.js                   ← Drop into your Express project
├── requirements.txt
├── Dockerfile
├── setup.sh
└── .env
```

---

## Retrain Models

Retrain any time you have real data — replace the `generate_*_data()` functions in the training scripts with your MongoDB queries:

```python
# Example: replace synthetic data with real MongoDB data
from pymongo import MongoClient

client = MongoClient(os.getenv("MONGO_URI"))
db = client["omniwork"]

tasks = list(db.tasks.find({"priority": {"$exists": True}}))
df = pd.DataFrame(tasks)
```

Then run:
```bash
source venv/bin/activate
python -m src.training.train_task    # or whichever model
```

# OmniWork — ML Models Technical README

> Concepts, Algorithms & Design Decisions  
> All models are advisory — final decisions remain with humans.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Model Deep Dives](#2-model-deep-dives)
   - [Task Priority Predictor](#-task-priority-predictor)
   - [Project Delay Predictor](#-project-delay-predictor)
   - [Employee Productivity Scorer](#-employee-productivity-scorer)
   - [Leave Approval Suggester](#-leave-approval-suggester)
   - [Resume Parser](#-resume-parser)
3. [Architecture & Integration](#3-architecture--integration)
4. [Training Data & Retraining](#4-training-data--retraining)
5. [Key Design Decisions](#5-key-design-decisions)
6. [Python Dependencies](#6-python-dependencies)

---

## 1. Overview

OmniWork embeds five machine learning models directly into the HR and project management workflow. Every classifier is a supervised model trained on synthetic but representative data. They are served by a Flask microservice on **port 5001**, called by the Node.js/Express backend, and their predictions surface in the React frontend as real-time AI insight panels.

| Model | Algorithm | Triggered When |
|---|---|---|
| Task Priority | Random Forest Classifier | A new task is created |
| Project Delay | Gradient Boosting Classifier | Project stats are fetched |
| Employee Productivity | Random Forest Classifier | Employee profile is viewed |
| Leave Approval | Gradient Boosting Classifier | A leave request is submitted |
| Resume Parser | NLP + Rule-based Extraction | A resume is uploaded |

---

## 2. Model Deep Dives

---

### 🎯 Task Priority Predictor

> Predicts whether a new task should be **Low / Medium / High / Critical** before it is saved to the database.

**Algorithm: Random Forest Classifier**

Random Forest trains an ensemble of decision trees, each on a random subset of features and data rows. The final prediction is a majority vote across all trees.

**Why Random Forest here?**

Task priority depends on a mix of numerical features (deadline days, estimated hours) and categorical ones (task type). Random Forest handles both natively without feature scaling, is robust to outliers (a 1-day deadline vs a 100-day deadline), and naturally outputs **class probabilities** — which we display as the confidence percentage on the task card. It also avoids overfitting far better than a single decision tree on a small synthetic dataset.

**Key Input Features**

| Feature | Description |
|---|---|
| `deadline_days` | Days remaining until the due date |
| `estimated_hours` | How long the task is expected to take |
| `task_type` | bug / feature / research / devops / qa (label encoded) |
| `num_dependencies` | *(optional)* How many other tasks block this one |
| `assignee_current_load` | *(optional)* Open tasks the assignee already has |
| `project_criticality` | *(optional)* 1 (low) to 4 (critical) importance of the parent project |

**Output:** Priority label + probability breakdown across all four classes + recommendation text.

**Trade-offs & Design Decisions**

- Random Forest was preferred over a single Decision Tree because bagging dramatically reduces variance.
- Gradient Boosting was considered but rejected — task priority is determined by a small, clean feature set where boosting's extra complexity offers no measurable accuracy gain.
- If `dueDate`, `estimatedHrs`, or `type` is absent, the ML call is skipped entirely and the user's manual priority is saved — **graceful degradation by design**.
- The priority label is `.toUpperCase()`-d before Prisma stores it to match the schema enum (`LOW/MEDIUM/HIGH/CRITICAL`).

---

### 📊 Project Delay Predictor

> Assesses whether a project is **On Track / At Risk / Delayed** based on live task counts and deadline proximity.

**Algorithm: Gradient Boosting Classifier**

Gradient Boosting builds trees sequentially — each new tree corrects the residual errors of all previous trees. This makes it excellent at capturing complex, non-linear interactions between features.

**Why Gradient Boosting here?**

Project health is a genuinely non-linear problem: a project that is 30% complete with 60 days left is fine, but the same project with 5 days left is critical. The interaction between completion percentage, deadline proximity, team size, and blockers cannot be captured by a linear model. Gradient Boosting learns these thresholds automatically from training data, outperforming Random Forest on this type of structured interaction task.

**Key Input Features**

| Feature | Description |
|---|---|
| `total_tasks` | Total number of tasks in the project |
| `completed_tasks` | Tasks with status DONE |
| `team_size` | Number of project members |
| `deadline_days_remaining` | Days until the project end date |
| `overdue_tasks` | *(optional)* Tasks blocked or past their due date |
| `budget_utilization_pct` | *(optional)* Fraction of budget consumed (1.0 = on budget) |
| `complexity_score` | *(optional)* 1–10 subjective complexity rating |

**Output:** Status label + confidence % + risk factors list + probability breakdown across all three classes.

**Trade-offs & Design Decisions**

- `completion_pct` is computed server-side (`done / total * 100`) before being passed to the model, reducing the feature space and keeping the model simpler.
- Risk factors are extracted from feature importance — the model reports which inputs pushed the prediction toward a negative outcome.
- The ML panel in `ProjectDetail.tsx` refreshes every time the stats endpoint is called, so it always reflects the latest task counts without any manual refresh.

---

### 👤 Employee Productivity Scorer

> Scores an employee as **Low / Average / Good / Excellent** and produces a 0–100 numeric score with strengths and improvement areas.

**Algorithm: Random Forest Classifier**

**Why Random Forest here?**

Productivity scoring is a label assignment problem across a small, clean set of performance metrics. Random Forest handles mixed feature types, produces calibrated probabilities, and is interpretable enough that we can derive "strengths" from features that scored above threshold and "improvement areas" from features below. A neural network would offer no practical advantage on a four-class problem with fewer than ten features — it would simply overfit and be harder to explain to HR stakeholders.

**Key Input Features**

| Feature | Description |
|---|---|
| `attendance_pct` | Percentage of working days the employee was present |
| `tasks_completed_monthly` | Tasks marked DONE this calendar month |
| `tasks_assigned_monthly` | Tasks assigned this calendar month |
| `on_time_delivery_pct` | Percentage of tasks completed on or before due date |
| `peer_review_score` | *(optional)* 1–5 rating from code reviews or peer feedback |
| `bug_rate` | *(optional)* Fraction of tasks that resulted in a reported bug |

**Output:** Band label + numeric score 0–100 + strengths list + improvement areas list + recommendation.

**Trade-offs & Design Decisions**

- The numeric score (0–100) is a **weighted linear formula** computed separately from the classifier. The classifier predicts the band; the score is a transparent calculation — both are returned to the frontend.
- Strengths and improvement areas are determined by comparing each feature value to a predefined threshold, not extracted from the model internals, making them human-readable and auditable by HR.
- The productivity call is triggered inside `getEmployeeById`, so managers see the AI score whenever they open an employee profile — no manual action required.
- Missing optional features are substituted with sensible defaults (e.g. `peer_review_score` defaults to 3 out of 5).

---

### 🏖️ Leave Approval Suggester

> Recommends **Approve / Conditional Approval / Reject** for a leave request before the manager reviews it.

**Algorithm: Gradient Boosting Classifier**

**Why Gradient Boosting here?**

Leave approval is a context-sensitive decision that depends on the *interaction* of multiple concurrent factors: how many teammates are already on leave, how close a project deadline is, how long the absence will be, and how much leave balance remains. These interactions are exactly what Gradient Boosting excels at.

Logistic Regression was ruled out because the decision boundary is non-linear. Random Forest was considered but rejected because the **"Conditional Approval" class is a minority class** — Gradient Boosting's sequential error correction improves recall on minority classes far better than Random Forest's independent bagging approach.

**Key Input Features**

| Feature | Description |
|---|---|
| `team_size` | Total headcount of the employee's organisation |
| `team_on_leave_count` | Colleagues with approved leave overlapping the requested period |
| `days_until_deadline` | Days to the nearest active project deadline for this employee |
| `request_duration_days` | Length of the requested leave in calendar days |
| `employee_leave_balance` | Remaining quota for the requested leave type |
| `project_phase` | *(optional)* planning / development / testing / deployment / maintenance |
| `advance_notice_days` | *(optional)* How many days in advance the request was made |
| `employee_performance_band` | *(optional)* 0 (Low) to 3 (Excellent) from the productivity model |

**Output:** Suggestion label + confidence % + team availability % + conditions list + recommendation.

**Trade-offs & Design Decisions**

- All five required fields are **computed automatically from the database** in `leave.service.js` — the employee never has to provide them manually.
- The suggestion is shown to the employee immediately after submission as an AI prediction panel, with a clear disclaimer that the final decision belongs to the manager.
- The model's output **never auto-approves or auto-rejects** — it is advisory only, surfaced as a visual panel in the React modal.

---

### 📄 Resume Parser

> Extracts structured employee data from an uploaded PDF or DOCX resume to auto-fill the employee creation form.

**Approach: NLP + Rule-based Extraction Pipeline**

Resume parsing is an information extraction task, not a classification task. There is no single "best model" — instead the parser uses a pipeline of techniques, each chosen for the specific field being extracted:

| Field | Technique | Why |
|---|---|---|
| Name, Email, Phone | Regex patterns | Highly structured — regex is fast and near-perfect |
| Skills | Keyword matching against curated vocabulary | Skills are finite and well-defined |
| Work Experience | Section header detection + date regex | Resumes follow predictable section patterns |
| Education | Section header detection + NLP tokenisation | Degree names follow known patterns |
| Designation / Role | Most-recent job title extraction | First job title after the latest date is the current role |

**Why Not a Deep Learning NER Model?**

Named Entity Recognition models like spaCy or BERT-based transformers are powerful but require significant compute resources and model file sizes (hundreds of MB). For a self-hosted HR tool where resumes follow fairly standard formats, a rule-based pipeline achieves >90% accuracy on the most important fields at a fraction of the infrastructure cost. The parser is designed as a **convenience feature** — the HR admin always reviews and corrects the auto-filled form before saving.

**Supported File Types**
- PDF — text extracted using `pdfplumber` or `PyMuPDF`
- DOCX — text extracted using `python-docx`
- Plain text — processed directly

---

## 3. Architecture & Integration

All five models are loaded into memory when the Flask app starts (`python src/app.py`). Each endpoint receives JSON, validates required fields, runs the prediction, and returns a structured JSON response.

The Node.js `mlClient.js` wraps each endpoint with a `try/catch` — if the Flask service is unreachable or returns an error, the application continues normally without ML fields (**graceful degradation**).

| Flask Endpoint | Called By (Express) |
|---|---|
| `POST /api/ml/task/predict-priority` | `task.service.js → createTask()` |
| `POST /api/ml/project/predict-delay` | `project.service.js → getProjectStats()` |
| `POST /api/ml/productivity/score` | `employee.controller.js → getEmployeeById()` |
| `POST /api/ml/leave/suggest` | `leave.service.js → createLeaveRequest()` |
| `POST /api/ml/resume/parse` | upload route → multer handler |

**Health check:** `GET /health` returns `{ status: "ok" }` — use this to verify the service is running.

---

## 4. Training Data & Retraining

All classifiers are trained on **synthetic datasets** generated to reflect realistic HR and project management distributions. Training scripts live in `ml-service/src/training/`.

**To retrain any model:**

```bash
cd ml-service
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Mac/Linux

python src/training/train_task_priority.py
python src/training/train_project_delay.py
python src/training/train_productivity.py
python src/training/train_leave_approval.py
```

The new `.pkl` model file is saved to `ml-service/src/models/` and loaded automatically on the next Flask restart.

> **For production:** Replace the synthetic training data with real historical records from your MongoDB database. The more real data the models see, the more accurate their predictions become for your organisation's specific patterns.

---

## 5. Key Design Decisions

**scikit-learn over PyTorch / TensorFlow**
All five tasks are tabular classification problems with fewer than 20 features. Deep learning adds substantial complexity — larger model files, slower cold-start, GPU dependency — with no accuracy benefit on structured tabular data at this scale.

**Separate microservice**
The Flask ML service runs independently of the Node.js backend on port 5001. This means the ML service can be restarted, retrained, or completely replaced without touching the main API.

**Graceful degradation**
Every `mlClient.js` call is wrapped in `try/catch` with `console.warn`. If Flask is down, the Express API returns normal results without ML fields rather than throwing a 500 error. The app always works; ML is an enhancement, not a dependency.

**Probabilistic output**
Every model returns probabilities for all classes, not just the winning label. This lets the frontend display confidence bars and lets managers understand the model's uncertainty before acting on a suggestion.

**No auto-actions**
ML predictions never trigger automatic approvals, rejections, or priority overrides without human review. They are surfaced as advisory panels only — the human always has the final say.

**Synchronous prediction**
ML calls are made synchronously within the Express request lifecycle (awaited before the DB write). For high-traffic scenarios, consider moving to an async queue (BullMQ + Redis) where the ML call happens in the background and the result is patched into the record after completion.

---

## 6. Python Dependencies

| Package | Version | Purpose |
|---|---|---|
| `flask` | ≥ 3.0 | HTTP microservice framework |
| `flask-cors` | ≥ 4.0 | Cross-origin requests from React dev server |
| `scikit-learn` | ≥ 1.4 | Random Forest & Gradient Boosting classifiers |
| `pandas` | ≥ 2.0 | Feature DataFrame construction |
| `numpy` | ≥ 1.26 | Numerical operations |
| `joblib` | ≥ 1.3 | Model serialisation (.pkl files) |
| `pdfplumber` | ≥ 0.10 | PDF text extraction for resume parser |
| `python-docx` | ≥ 1.1 | DOCX text extraction for resume parser |

**Install all at once:**

```bash
pip install flask flask-cors scikit-learn pandas numpy joblib pdfplumber python-docx
```

---

*OmniWork ML Service · Built with scikit-learn, Flask, Node.js & React*  
*All models are advisory — final decisions remain with humans.*