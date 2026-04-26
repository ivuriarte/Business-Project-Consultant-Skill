# Backlog — FreelanceFlow
_Generated: 2026-04-27 09:14_

> **Note:** This is a sample output from `scripts/idea_to_backlog.py`. It uses a fictional invoice management app called **FreelanceFlow** to demonstrate the format and depth of output you can expect.

## Project Overview
- **Problem:** Freelancers lose hours every week manually tracking invoices in spreadsheets, chasing late payments, and sending follow-ups by hand
- **Target User:** Freelance designers and developers aged 25–40 who work remotely and manage 3–10 active clients at a time
- **Success in 90 days:** 100 active users, average 3 invoices sent per user per week, < 5% support tickets related to invoicing
- **Tech Stack:** Next.js, Supabase, Tailwind CSS

---

## EP01 — User Authentication
> **Business Value:** Without an identity layer, users cannot have personal data — every invoice, client, and payment record must be tied to a verified account.

### EP01-S01 | Must Have | S (1–2 days) | MVP
> As a new user, I want to register with my email and password, so that I can create a personal account.

**Value Score:** 4.80/5.0
_(Business Value: 5 | User Impact: 5 | Feasibility: 4)_

**Acceptance Criteria:**
1. GIVEN I am on the registration page, WHEN I fill in a valid email and a password of 8+ characters and click "Create Account", THEN my account is created, I am logged in, and I am redirected to the dashboard.
2. GIVEN I enter an email that is already registered, WHEN I click "Create Account", THEN I see the error "This email is already in use. Try logging in." and the form is not submitted.
3. GIVEN I enter a password fewer than 8 characters, WHEN I click "Create Account", THEN I see the inline error "Password must be at least 8 characters" and the form is not submitted.
4. GIVEN my account is created, WHEN I check my inbox, THEN I receive a verification email within 2 minutes with a working link.

### EP01-S02 | Must Have | S (1–2 days) | MVP
> As a returning user, I want to log in with my email and password, so that I can access my invoices and client data.

**Value Score:** 4.80/5.0
_(Business Value: 5 | User Impact: 5 | Feasibility: 4)_

**Acceptance Criteria:**
1. GIVEN I am on the login page, WHEN I enter a valid email and password and click "Log In", THEN I am authenticated and redirected to my dashboard.
2. GIVEN I enter an incorrect password, WHEN I click "Log In", THEN I see the error "Incorrect email or password." and I am not logged in.
3. GIVEN I have failed 5 consecutive login attempts, WHEN I try again, THEN I see "Too many attempts. Try again in 15 minutes." and the account is temporarily locked.

### EP01-S03 | Should Have | XS (< 1 day) | Stabilization
> As a logged-in user, I want to reset my password via email, so that I can regain access if I forget it.

**Value Score:** 3.60/5.0
_(Business Value: 3 | User Impact: 4 | Feasibility: 5)_

**Acceptance Criteria:**
1. GIVEN I am on the login page, WHEN I click "Forgot password?" and enter my email, THEN I receive a password reset email within 2 minutes.
2. GIVEN I click the reset link in my email, WHEN I enter and confirm a new password of 8+ characters, THEN my password is updated and I am redirected to the login page.
3. GIVEN the reset link is more than 1 hour old, WHEN I click it, THEN I see "This link has expired. Request a new one."

---

## EP02 — Invoice Management
> **Business Value:** Invoicing is the core function of the app. Without it, there is no product. Every other feature exists to support or enhance the invoicing workflow.

### EP02-S04 | Must Have | M (3–5 days) | MVP
> As a freelancer, I want to create a new invoice with line items, so that I can bill my clients professionally.

**Value Score:** 5.00/5.0
_(Business Value: 5 | User Impact: 5 | Feasibility: 5)_

**Acceptance Criteria:**
1. GIVEN I am on the invoice creation page, WHEN I fill in client name, line items (description, quantity, rate), and click "Save Invoice", THEN the invoice is saved with a unique auto-generated invoice number and a "Draft" status.
2. GIVEN I add a line item, WHEN I enter quantity and rate, THEN the subtotal for that line item and the invoice total are calculated automatically.
3. GIVEN I leave the client name empty, WHEN I click "Save Invoice", THEN I see the error "Client name is required."
4. GIVEN I save a draft invoice, WHEN I navigate to the invoices list, THEN the new invoice appears with its number, client name, total, and "Draft" status.

### EP02-S05 | Must Have | S (1–2 days) | MVP
> As a freelancer, I want to send an invoice to my client via email, so that they receive a professional PDF and can act on it immediately.

**Value Score:** 4.75/5.0
_(Business Value: 5 | User Impact: 5 | Feasibility: 4)_

**Acceptance Criteria:**
1. GIVEN I have a draft invoice, WHEN I click "Send Invoice" and confirm, THEN the invoice status changes to "Sent", the client receives an email with a PDF attachment and a payment link, and I see a confirmation banner.
2. GIVEN the email is sent, WHEN I check the invoice detail page, THEN I see a "Sent on [date]" timestamp.
3. GIVEN the client's email is invalid, WHEN I click "Send Invoice", THEN I see the error "Please add a valid client email before sending."

### EP02-S06 | Should Have | M (3–5 days) | Enhancement
> As a freelancer, I want to set a payment due date on each invoice, so that clients know exactly when payment is expected.

**Value Score:** 3.75/5.0
_(Business Value: 4 | User Impact: 4 | Feasibility: 3)_

**Acceptance Criteria:**
1. GIVEN I am creating or editing an invoice, WHEN I select a due date from the date picker, THEN the due date is saved and displayed on the invoice PDF and the client-facing payment page.
2. GIVEN no due date is set, WHEN I view the invoice, THEN it shows "Due: Upon receipt."
3. GIVEN today's date is past the due date and the invoice is unpaid, WHEN I view the invoices list, THEN the invoice is highlighted in red with an "Overdue" badge.

---

## EP03 — Payment Tracking
> **Business Value:** Knowing which invoices are paid, overdue, or pending is the core value users get from this app over a spreadsheet. Without it, the app is just a PDF generator.

### EP03-S07 | Must Have | M (3–5 days) | MVP
> As a freelancer, I want to mark an invoice as paid, so that I can keep an accurate record of received payments.

**Value Score:** 4.55/5.0
_(Business Value: 5 | User Impact: 5 | Feasibility: 3)_

**Acceptance Criteria:**
1. GIVEN I have a sent invoice, WHEN I click "Mark as Paid" and confirm, THEN the invoice status changes to "Paid" with a payment date timestamp.
2. GIVEN an invoice is marked as paid, WHEN I view the dashboard, THEN the total paid amount for the current month is updated.
3. GIVEN an invoice is already marked as paid, WHEN I view the invoice detail, THEN the "Mark as Paid" button is replaced with "Paid on [date]."

### EP03-S08 | Should Have | L (1–2 weeks) | Enhancement
> As a freelancer, I want overdue invoices to trigger automatic reminder emails to my clients, so that I don't have to chase payments manually.

**Value Score:** 4.05/5.0
_(Business Value: 4 | User Impact: 4 | Feasibility: 4)_

**Acceptance Criteria:**
1. GIVEN an invoice is past its due date and unpaid, WHEN 3 days have passed since the due date, THEN the system automatically sends a reminder email to the client.
2. GIVEN a reminder has been sent, WHEN I view the invoice, THEN I see a "Reminder sent on [date]" log entry.
3. GIVEN I have disabled reminders for a specific invoice, WHEN the due date passes, THEN no automatic reminder is sent for that invoice.

---

## EP04 — Client Management
> **Business Value:** Reusable client records eliminate repetitive data entry. Without this, users re-type client details on every invoice — a known friction point that drives churn.

### EP04-S09 | Must Have | S (1–2 days) | MVP
> As a freelancer, I want to save client details (name, email, address), so that I can select them quickly when creating new invoices.

**Value Score:** 4.30/5.0
_(Business Value: 4 | User Impact: 5 | Feasibility: 4)_

**Acceptance Criteria:**
1. GIVEN I am on the Clients page, WHEN I fill in client name and email and click "Save Client", THEN the client is saved and appears in my client list.
2. GIVEN I am creating an invoice, WHEN I type the first 2 characters of a client name, THEN a dropdown shows matching saved clients.
3. GIVEN I select a saved client on an invoice, WHEN the invoice is saved, THEN the client's name and email are pre-filled and the invoice is linked to that client record.
