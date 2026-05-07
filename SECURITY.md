# Security Policy – Fraud Detection & Risk Monitoring System

## Overview
This document outlines the security practices, threat considerations, and protection mechanisms implemented in the Fraud Detection and Risk Monitoring System developed for Datamak Technologies.

The system stores and analyses sensitive financial and behavioural data using a Neo4j graph database. Because the application deals with transactions, accounts, devices and locations, protecting confidentiality, integrity and availability is critical.

---

## 1. Security Objectives

The system is designed to:

- Protect sensitive customer and transaction data  
- Prevent unauthorized access to the database and APIs  
- Ensure integrity of fraud detection results  
- Minimise risk of data leaks or tampering  
- Support secure development and deployment practices  

---

## 2. Threat Model

The main threats considered in this system are:

### 2.1 Unauthorized Access
Attackers attempting to:
- Access the database directly
- Use stolen credentials
- Bypass authentication

### 2.2 Data Tampering
Malicious modification of:
- Transaction data
- Risk scores
- Fraud flags

### 2.3 Injection Attacks
Possible injection into:
- API inputs
- Cypher queries
- Login forms

### 2.4 Credential Exposure
Risk of exposing:
- Neo4j database credentials
- API secrets
- Session tokens

### 2.5 Data Leakage
Sensitive information such as:
- Customer identity
- Device information
- Transaction history

---

## 3. Authentication & Authorization

### 3.1 Session-Based Authentication
The backend uses **session management** to authenticate users.

Security measures:
- Secure session cookies
- Sessions expire automatically
- Credentials are never stored on the client

### 3.2 Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| Admin | Full system access |
| Analyst | View transactions & risk reports |
| User | Limited dashboard access |

The principle of **least privilege** is enforced.

---

## 4. Secrets & Credential Protection

Sensitive credentials are stored in **environment variables** and never hardcoded.

Examples:
- Neo4j URI  
- Database username  
- Database password  
- Session secret  

The `.env` file is excluded using `.gitignore` to prevent credentials from being uploaded to GitHub.

---

## 5. API Security

### 5.1 Input Validation
All user input is validated to prevent:
- Injection attacks
- Malformed requests
- Unexpected data types

Validation includes:
- Required field checks  
- Type validation  
- Length restrictions  

### 5.2 Rate Limiting (Recommended)
To prevent brute force and abuse:
- Login attempts should be limited
- Suspicious request spikes should be monitored

---

## 6. Database Security (Neo4j)

### 6.1 Parameterized Cypher Queries
All Cypher queries use parameters.

Example Cypher query:

    MATCH (c:Customer {id: $customerId})
    RETURN c

This prevents **Cypher Injection attacks**.

### 6.2 Restricted Database Access
Database access is limited to:
- Backend server only
- No direct public exposure

---

## 7. Data Protection

### 7.1 Sensitive Data Handling
The system avoids storing:
- Plain-text passwords
- Unnecessary personal information

Only data required for fraud detection is stored.

### 7.2 Secure Transmission
All communication should use **HTTPS** in production to prevent:
- Man-in-the-middle attacks
- Packet sniffing

---

## 8. Logging & Monitoring

The system logs:
- Login attempts
- Failed authentication
- Suspicious activity detection
- High-risk transaction flags

Logs help:
- Detect breaches early
- Investigate incidents
- Improve fraud detection

---

## 9. Fraud Detection Security Measures

The system automatically flags high-risk behaviour including:

- Multiple accounts linked to one device  
- Rapid transaction frequency  
- Transactions between previously flagged entities  
- Suspicious location changes  

These mechanisms reduce fraud risk and act as a security layer.

---

## 10. Known Limitations (Academic Prototype)

This project is a **prototype** and does not yet include:

- Multi-factor authentication (MFA)  
- Full encryption of stored data  
- Advanced intrusion detection systems  
- Production-grade monitoring tools  

These would be required in a real-world deployment.

---

## 11. Responsible Disclosure

If a vulnerability is discovered in this project, it should be reported to the development team responsibly so it can be investigated and resolved.
