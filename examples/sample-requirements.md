# Requirements Document — FreelanceFlow
_Elicited: 2026-04-27 08:45_

> **Note:** This is a sample output from `scripts/requirements_elicitor.py`. It uses a fictional invoice management app called **FreelanceFlow** to demonstrate the format and depth of output you can expect.

## 1. Project Overview
**Name:** FreelanceFlow  
**Context:** FreelanceFlow is a web application that helps freelancers create, send, and track invoices. It replaces manual spreadsheet-based invoicing with a streamlined digital workflow that saves time and reduces late payments.  
**Target Users:** Freelance designers and developers aged 25–40 who work remotely, manage 3–10 active clients at a time, and currently track invoices in Excel or Google Sheets.  
**Primary Goal:** Allow a freelancer to create and send a professional invoice to a client in under 5 minutes, and automatically track its payment status.

---

## 2. Business Requirements

| ID | Description | Priority | Source |
|---|---|---|---|
| BR-001 | The business must reduce the average time a freelancer spends on invoicing from 3 hours/week to under 30 minutes/week | Must Have | Business Outcome |
| BR-002 | The app must support a free tier that drives user acquisition and a paid Pro tier that generates recurring revenue | Must Have | Success Metric |
| BR-003 | If this app is not built, freelancers will continue to lose an estimated ₱15,000–₱40,000/year in late or forgotten payments | Must Have | Business Risk |
| BR-004 | Business owners (freelancers) need visibility into monthly revenue, outstanding amounts, and overdue invoices without manual calculation | Must Have | Stakeholder Need |
| BR-005 | The app must comply with applicable data privacy laws (e.g. RA 10173 in the Philippines) regarding storage of client contact information | Must Have | Compliance |
| BR-006 | The app should eventually support multiple currencies for freelancers working with international clients | Should Have | Stakeholder Need |

---

## 3. Functional Requirements

| ID | Description | Priority | Source |
|---|---|---|---|
| FR-001 | The system must allow a user to create an invoice with: client name, line items (description, quantity, rate), auto-calculated totals, and a due date | Must Have | Create Operations |
| FR-002 | The system must allow a user to view a list of all invoices filtered by status (Draft / Sent / Paid / Overdue) | Must Have | Read Operations |
| FR-003 | The system must allow a user to edit a Draft invoice before it is sent | Must Have | Update Operations |
| FR-004 | The system must allow a user to delete a Draft invoice | Must Have | Delete Operations |
| FR-005 | The system must send an automatic reminder email to the client when an invoice is 3 days overdue | Should Have | Notifications |
| FR-006 | The system must support email/password registration and login, with email verification | Must Have | Auth & Access |
| FR-007 | The system must integrate with an email provider (e.g. Resend or SendGrid) to deliver invoice PDFs and payment reminder emails | Must Have | Integrations |
| FR-008 | The system must display a dashboard showing: total invoiced, total paid, total outstanding, and overdue invoices for the current month | Must Have | Reporting |
| FR-009 | The system must show a meaningful error message when a required field is missing or invalid at form submission | Must Have | Error Handling |
| FR-010 | The system must allow a user to save reusable client profiles (name, email, billing address) | Must Have | Create Operations |
| FR-011 | The system must allow a user to export a single invoice as a PDF | Should Have | Read Operations |
| FR-012 | The system must allow a user to mark an invoice as paid with a recorded payment date | Must Have | Update Operations |

---

## 4. Non-Functional Requirements

| ID | Description | Priority | Source |
|---|---|---|---|
| NFR-001 | Invoice list and dashboard must load within 2 seconds under normal load (< 500 concurrent users) | Should Have | Performance |
| NFR-002 | The system must support at least 500 concurrent users in MVP; architecture must allow scaling to 5,000 without a rewrite | Should Have | Scalability |
| NFR-003 | Target uptime of 99.5% (< 44 hours downtime per year); acceptable for a pre-Series A product | Should Have | Availability |
| NFR-004 | All passwords must be hashed (bcrypt or Supabase Auth). All data in transit must use HTTPS/TLS. OWASP Top 10 must be addressed before launch. | Must Have | Security |
| NFR-005 | The UI must be usable on mobile browsers (iOS Safari, Android Chrome) without a native app — responsive layout required | Must Have | Compatibility |
| NFR-006 | Client PII (email, billing address) must be stored encrypted at rest in compliance with RA 10173 | Must Have | Data |
| NFR-007 | Application errors must be logged to an observability tool (e.g. Sentry) with alert thresholds for error rate spikes | Should Have | Observability |

---

## 5. Constraints

| ID | Description | Priority | Source |
|---|---|---|---|
| CON-001 | The tech stack is fixed: Next.js (App Router), Supabase (Auth + DB), Tailwind CSS, Vercel (hosting) | Must Have | Hard limit on design/build |
| CON-002 | The MVP must be shipped within 6 weeks with a solo developer | Must Have | Hard limit on design/build |
| CON-003 | The total operating budget for MVP is under $50/month (Vercel + Supabase free tiers, with one paid email provider) | Must Have | Hard limit on design/build |

---

## 6. Assumptions

| ID | Description | Priority | Source |
|---|---|---|---|
| ASS-001 | Users have basic digital literacy — they can fill in a web form, use a browser, and read an email | Could Have | Needs validation before shipping |
| ASS-002 | Supabase free tier is sufficient for MVP load (500 MAU, < 500MB DB) | Could Have | Needs validation before shipping |
| ASS-003 | Freelancers in the target market are willing to pay ₱299–₱499/month for a Pro plan if the free tier proves value | Could Have | Needs validation before shipping |
| ASS-004 | The primary device for usage is a laptop/desktop — mobile is secondary | Could Have | Needs validation before shipping |

---

## 7. Out of Scope

- Native mobile app (iOS / Android) — deferred to post-Beta
- Stripe or payment gateway integration for online invoice payment — deferred to V1.1
- Multi-user / team accounts — deferred to V2
- Accounting software integrations (QuickBooks, Xero) — deferred to V2
- Tax calculation or VAT/GST handling — deferred to V1.1

---

## 8. Stakeholder Register

| Name | Role | Interest | Influence |
|---|---|---|---|
| Ian Vince | Business Owner / Solo Developer | Ship a working MVP that validates the invoicing pain point | High |
| Alpha Test Users (20–50 freelancers) | End Users | Easy invoicing, fewer late payments, professional look | High |
| Email Provider (Resend) | Third-Party Vendor | Reliable email delivery for invoices and reminders | Medium |
| Vercel | Infrastructure Vendor | Stable hosting within free tier limits | Medium |

---

## 9. Requirements Summary
- Business: 6
- Functional: 12
- Non-Functional: 7
- Constraint: 3
- Assumption: 4
- **Total: 32**

---

_This document was generated by the Business and Project Consultant skill._  
_Review with all stakeholders before starting development._
