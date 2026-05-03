# 🧟 CloudBurn Zombie Detection & Spike Alerting

This document outlines the architecture, logic, and integration of the automated zombie resource detection and cost spike alerting system.

---

## 🚀 Key Features

### 1. Unified Alerting Engine
We have consolidated all infrastructure anomalies into a single **Alerts & Anomalies** dashboard. This system now tracks:
- **Cost Spikes**: Daily cost increases > 200% baseline.
- **Zombie Resources**: Idle assets (EC2, RDS, S3, DynamoDB) detected over a multi-day lookback window.

### 2. AI-Powered Root Cause Analysis
Every alert is automatically processed by our **AI Insights Engine** (powered by LLaMA 3.1) which generates:
- A plain-English explanation of why the alert occurred.
- Technical remediation steps.
- Business impact assessment (e.g., potential savings).

### 3. Automated Detection Crons
The system runs silently in the background:
- **Resource Sync (Hourly)**: Collects raw CloudWatch metrics and cost data.
- **Spike Detection (Hourly)**: Compares today's cost vs. yesterday's to catch budget-draining bugs instantly.
- **Zombie Scan (Every 12 Hours)**: Performs a deep analysis of usage patterns to identify orphaned resources.

---

## 🛠 Technical Architecture

### Data Models
- **`ResourceSnapshot`**: Stores hourly usage metrics (CPU, Connections, Requests) for all cloud assets.
- **`SpikeAlert`**: A unified model storing both cost-based and usage-based anomalies.
- **`ZombieResource`**: Persistent record of detected idle assets for tracking and resolution.

### Detection Thresholds
| Service | Metric | Idle Threshold | Lookback |
| :--- | :--- | :--- | :--- |
| **EC2** | CPUUtilization | < 5% Avg | 7 Days |
| **RDS** | DatabaseConnections | 0 Avg | 3 Days |
| **S3** | NumberOfRequests | 0 Avg | 7 Days |
| **DynamoDB** | ConsumedReadUnits | 0 Avg | 7 Days |

---

## 📈 Integration & Usage

### Backend
- **Services**: `spike.service.js`, `zombie.service.js`, `ai.service.js`.
- **Jobs**: `spike.job.js`, `zombie.job.js`, `resourceSync.job.js`.
- **Endpoints**:
  - `GET /api/alerts`: List all active/resolved anomalies.
  - `PATCH /api/alerts/:id/resolve`: Acknowledge and resolve an alert.

### Frontend
- **Alerts Page**: Real-time dashboard with dynamic card structures for different alert types.
- **Zombie Detector**: Dedicated view for deep-diving into idle resource metrics and AI summaries.

---

## 🧪 Testing the Feature
To seed realistic data for testing (especially for Organization `69f7953eeaa270960dc230c2`):
```bash
# In the /backend directory
node scripts/seedOrgData.js
```
This will populate the database with a mix of cost spikes and zombie resources, complete with AI explanations.
