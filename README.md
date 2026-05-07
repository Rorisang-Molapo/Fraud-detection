# Fraud Detection System

> A simple fraud detection system built using React and Neo4j graph database

**Developers:** Isaac xv¡ & just_ranks xv¡ & Matlali xv¡ & BlackBeard1-0-1 xv¡ & Tshetshe xv¡ & Katleho Ramohlabi AKA Mr Zulu <br/>
**Course:** Database Systems

---

## About The Project

This project is a fraud detection and risk monitoring system that uses a graph database (Neo4j) to model relationships between customers, accounts, transactions, devices, IP addresses, and locations. The system automatically detects suspicious patterns such as money laundering, impossible travel, VPN usage, and high-risk transaction behavior.

---

## Technologies Used

| Technology | Purpose |
|------------|---------|
| React | Frontend UI |
| Neo4j | Graph database |
| Express.js | Backend API |
| vis-network | Network visualization |
| recharts | Charts and graphs |
| axios | API calls |

---
## CodeQL Status
[![CodeQL Advanced](https://github.com/Rorisang-Molapo/Fraud-detection/actions/workflows/codeql.yml/badge.svg)](https://github.com/Rorisang-Molapo/Fraud-detection/actions/workflows/codeql.yml)

## Below is the installation guide document, to provide user on how to use the system through installation of dependencies.

### Step 1: Clone the Repository

---
git clone https://github.com/yourusername/Fraud-detection-system.git <br/>
cd Fraud-detection-system

## step 2: install backend dependencies

npm install

## step 3: Install Frontend Dependencies
cd frontend
npm install
cd ..

## Step 4: Set Up Neo4j Database
Download and install Neo4j Desktop
Create a new database (default: bolt://localhost:7687)
Open Neo4j Browser (http://localhost:7474)
login in using the url in your instance and the password you set when creating the instance 
connect your instance to Query and run your commands 

## Step 5: Configure Environment Variables
Create a .env file in the root directory but remeber that you never push this file to git hub since it contains all your database passwords 
this is how your env file will look like:
```
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=yourpassword
```
## start your application.

##  FEDERAL 20! TO THE WORLD © 2026
