# AI Triage Assistant — Product Requirements Document

## Problem Statement

When employees request access to new AI tools, every request lands on the desks of the Head
of IT and the Infosec team. Both are time-poor and naturally risk-averse. The result is a
bottleneck: requests stall for days or weeks, approvals are inconsistent, and the back-and-forth
is draining for everyone. There is no structured framework to ensure the right questions are
asked, the right perspectives considered, or the right information captured.

## Goal

Build a POC web application that automates the first-pass review of AI tool access requests
using a configurable team of AI agents. The output is a structured, balanced report that gives
IT/Infosec everything they need to make a fast, well-informed decision — without having to chase
the requester for missing information themselves.

## Non-Goals (POC Scope)

- No integration with ticketing systems (Jira, ServiceNow) in v1
- No email notifications
- No SSO / enterprise identity provider — single shared password for IT/Infosec dashboard
- No SLA enforcement or escalation workflows
- No mobile-optimised UI

## Users

| User | Description | Primary Need |
|---|---|---|
| Employee (Requester) | Any staff member wanting access to an AI tool | Simple form to submit request; know it's being reviewed |
| IT/Infosec Reviewer | Head of IT or Infosec team member | Fast, thorough, structured view of each request to make a decision |
| Admin | IT/Infosec power user | Ability to configure the agent team without redeployment |

## User Stories

**Employee**
- As an employee, I can submit a request for a new AI tool by filling in a structured form
- As an employee, I am asked targeted follow-up questions if my submission is incomplete
- As an employee, I can see the status of my request (submitted / under review / decision made)
- As an employee, I receive a clear outcome (approved / approved with conditions / deferred / rejected)

**IT/Infosec Reviewer**
- As a reviewer, I can see all pending and completed requests in a dashboard
- As a reviewer, I can watch the agent discussion unfold in real-time for any request
- As a reviewer, I can read a tiered report with a clear recommendation at the top
- As a reviewer, I can expand individual agent perspectives and the full discussion transcript
- As a reviewer, I can copy or print the final report to share with stakeholders

**Admin**
- As an admin, I can enable or disable agents in the review team
- As an admin, I can edit an agent's system prompt, focus areas, and risk weighting
- As an admin, I can add a new agent persona without touching code

## Functional Requirements

### FR1 — Request Submission
- Form collects: tool name, tool URL, requester name/team/role, business justification,
  data types processed, number of users, whether data leaves company systems, estimated cost,
  whether it replaces an existing tool, any existing vendor documentation URL
- All required fields validated client-side before submission
- Submission creates a request record with status `draft` → `awaiting_clarification`

### FR2 — Intake & Clarification
- Intake Agent reviews submission and generates 2–6 targeted follow-up questions
- Each question includes a rationale visible to the employee
- Employee answers on a dedicated Clarification page
- Maximum 2 clarification rounds; triage begins regardless after round 2 (gaps flagged in report)
- Status transitions to `in_progress` when intake is satisfied

### FR3 — Multi-Agent Review
- Phase 2: All enabled agents independently analyse the request in parallel
- Phase 3: 2 structured discussion rounds; agents respond to peer concerns in risk-weight order
- Phase 4: Synthesis Agent produces the final tiered report
- All phases streamed as SSE events to the IT/Infosec dashboard

### FR4 — Final Report
- Section 1: Recommendation (APPROVE / APPROVE WITH CONDITIONS / DEFER / REJECT) + risk level
- Section 2: Executive summary (3–5 sentences)
- Section 3: Required conditions, each attributed to the raising agent
- Section 4: Risk matrix (risk, severity, likelihood, proposed mitigation)
- Section 5: Per-agent perspectives [expandable]
- Section 6: Full discussion transcript [expandable]
- Section 7: Original request details [expandable]
- Copy-to-clipboard and print-to-PDF available

### FR5 — Agent Configuration
- Agents configurable at runtime via IT/Infosec dashboard (no redeployment needed)
- Configurable fields: enabled/disabled, name, title, system prompt template, focus areas,
  risk weighting, vote weight, dealbreakers, required questions, model, maxTokens
- Changes take effect on the next triage run; existing reports unaffected
- Agent config snapshot stored with each completed request for audit

### FR6 — Dual View (Employee vs Reviewer)
- Employee view: status indicator only ("Submitted", "Under Review", "Decision Made")
- Reviewer view: full live discussion stream + final report
- No shared session — employee cannot navigate to the reviewer URL without the password

## Non-Functional Requirements

- Response time: Intake Agent follow-up questions returned within 10 seconds
- Streaming: First SSE token from Phase 3 discussion within 5 seconds of triage start
- Reliability: Failed individual agent calls do not abort the entire triage; error is logged
  and flagged in the report with the agent marked as "unavailable"
- Security: `ANTHROPIC_API_KEY` never exposed to client; all Claude calls server-side only
- Persistence: All requests, messages, and reports survive server restarts (SQLite)

## Success Metrics (POC)

- A reviewer can read the top 3 sections of a report and make a decision in under 2 minutes
- The report surfaces at least one concern the original requester did not anticipate
- Agents demonstrably disagree on at least some requests (not all rubber-stamping)
- An admin can change an agent's system prompt and observe changed behaviour within one triage run
