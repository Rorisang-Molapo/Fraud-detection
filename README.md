# Fraud Detection System

> A simple fraud detection system built using React and Neo4j graph database

**Developers:** Isaac xv¡ & just_ranks xv¡ & Matlali xv¡ & BlackBeard1-0-1 xv¡ & Tshetshe xv¡ & Zulu xv¡ <br/>
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
| vis-network | Network visualization in Network page|
| recharts | Charts and graphs |
| axios | API calls |
| express-session | Authentication |
| neo4j-driver | Database connection |

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

## References

1. S. S. A. N. Al-Masri and M. S. H. H. Al-Ahmad, "Fraud Detection in Financial Transactions Using Graph Databases," *Journal of Information Security and Applications*, vol. 68, 2022.

2. R. K. L. Tan and V. C. S. Lee, "Graph-Based Anomaly Detection for Anti-Money Laundering," *IEEE Transactions on Knowledge and Data Engineering*, vol. 34, no. 5, pp. 2100-2114, 2022.

3. M. J. Smith, "Real-Time Fraud Detection Using Neo4j," *International Journal of Database Management Systems*, vol. 14, no. 2, pp. 45-62, 2023.

4. K. Patel and S. Kumar, "Graph Neural Networks for Financial Fraud Detection," *IEEE Access*, vol. 11, pp. 45230-45245, 2023.

5. L. Chen, Y. Wang, and H. Zhang, "Impossible Travel Detection in Banking Systems," *Computers & Security*, vol. 118, 2022.

6. T. Williams and J. Brown, "Money Laundering Detection Using Graph Traversal," *Journal of Financial Crime*, vol. 29, no. 4, pp. 1120-1138, 2022.

7. A. Garcia, R. Martinez, and C. Lopez, "Risk Scoring Models for Graph Databases," *Expert Systems with Applications*, vol. 200, 2022.

8. N. Okonkwo and E. Adebayo, "Real-Time Fraud Alert Systems for Financial Institutions," *Information Systems Frontiers*, vol. 25, pp. 789-805, 2023.

9. D. Johnson and M. Lee, "Network Visualization for Fraud Investigation," *IEEE Transactions on Visualization and Computer Graphics*, vol. 28, no. 6, pp. 2340-2353, 2022.

10. H. Kim, S. Park, and J. Choi, "Session-Based Authentication in Financial Systems," *Computers & Security*, vol. 125, 2023.
## start your application.

##  FEDERAL 20! TO THE WORLD © 2026
