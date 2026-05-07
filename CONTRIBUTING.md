# Contributing Guidelines – Fraud Detection & Risk Monitoring System

Thank you for contributing to the Fraud Detection & Risk Monitoring System developed for Datamak Technologies.

This document outlines how team members should contribute to ensure consistency, security, and maintainability of the project.

---

## 1. Project Structure

The system consists of:

- **Frontend** – React application (UI & dashboard)
- **Backend** – Node.js + Express API
- **Database** – Neo4j Graph Database
- **Queries** – Cypher scripts for fraud detection and risk analysis

All contributors must follow the agreed project structure and naming conventions.

---

## 2. Branching Strategy

To avoid conflicts:

- `main` → Stable and tested code only
- `develop` → Integration branch (if used)
- Feature branches → Created per task

Feature branch naming format:

```
feature/<short-description>
```

Example:

```
feature/add-risk-score-query
feature/fix-login-auth
feature/device-link-detection
```

Never push unfinished or broken code directly to `main`.

---

## 3. Making Changes

### Step 1 – Pull Latest Code

Before making changes:

```
git pull origin main
```

### Step 2 – Create a Feature Branch

```
git checkout -b feature/your-feature-name
```

### Step 3 – Make Your Changes

- Follow coding standards
- Write clean, readable code
- Comment complex logic
- Use parameterized Cypher queries

### Step 4 – Test Before Pushing

Ensure:

- No console errors
- API endpoints work correctly
- Neo4j queries execute successfully
- Fraud detection logic produces expected results

### Step 5 – Commit Properly

Use clear commit messages:

```
Add high-frequency transaction detection query
Fix session authentication bug
Improve risk score calculation logic
```

Avoid vague messages like:
```
update
fix stuff
changes
```

---

## 4. Coding Standards

### Backend (Node.js / Express)
- Use consistent indentation
- Use environment variables for secrets
- Never hardcode database credentials
- Always validate user input
- Use parameterized Cypher queries

### Frontend (React)
- Keep components modular
- Avoid large monolithic components
- Handle API errors properly
- Do not expose sensitive data in the UI

### Cypher Queries
- Use meaningful variable names
- Avoid overly complex queries without comments
- Optimize traversal depth where possible
- Ensure queries align with the graph schema

---

## 5. Security Rules

All contributors must:

- Never commit `.env` files
- Never expose Neo4j credentials
- Avoid logging sensitive data
- Follow secure coding practices
- Prevent injection vulnerabilities

If a security issue is discovered, report it immediately to the team.

---

## 6. Testing Requirements

Before submitting changes:

- Verify authentication works
- Confirm fraud detection flags correct patterns
- Test edge cases (no data, invalid inputs)
- Ensure no duplicate nodes or relationships are created

---

## 7. Documentation Requirements

Any major contribution must include:

- Updated README (if needed)
- Updated schema documentation (if nodes/relationships change)
- Explanation of new Cypher queries
- Comments explaining complex logic

---

## 8. Graph Schema Changes

If you modify the graph model:

- Clearly document new node labels
- Document new relationship types
- Update ER-to-graph mapping
- Ensure existing queries still work

Breaking schema changes must be discussed with the team first.

---

## 9. Pull Request Guidelines

Before merging:

- Ensure code is tested
- Resolve merge conflicts
- Provide a clear description of changes
- Confirm no sensitive information is included

Pull requests should explain:
- What was changed
- Why it was changed
- How it was tested

---

## 10. Code of Conduct

All contributors must:

- Communicate respectfully
- Review code constructively
- Collaborate professionally
- Meet agreed deadlines

---

## 11. Academic Integrity

This project is developed as part of an academic assignment.

All contributors must:
- Ensure work is original
- Properly reference external sources
- Avoid plagiarism
- Follow university academic policies
