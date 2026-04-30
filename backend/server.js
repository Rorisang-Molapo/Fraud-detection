const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: 'anything',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }
}));

const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

// Auth middleware
const requireAuth = (req, res, next) => {
    if (req.session.user && req.session.user.loggedIn) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    const neo4jSession = driver.session();
    
    try {
        const result = await neo4jSession.run(
            `MATCH (u:User {username: $username, password: $password}) 
             RETURN u.username AS username, u.role AS role`,
            { username, password }
        );
        
        if (result.records.length > 0) {
            req.session.user = {
                username: result.records[0].get('username'),
                role: result.records[0].get('role'),
                loggedIn: true
            };
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        await neo4jSession.close();
    }
});

// Check auth endpoint
app.get('/api/check-auth', (req, res) => {
    if (req.session.user && req.session.user.loggedIn) {
        res.json({ authenticated: true });
    } else {
        res.json({ authenticated: false });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Dashboard Stats
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    const session = driver.session();
    
    try {
        const result = await session.run(`
            MATCH (c:Customer)
            WITH COUNT(c) AS totalCustomers
            MATCH (t:Transaction)
            WITH totalCustomers, COUNT(t) AS totalTransactions
            MATCH (t2:Transaction {isFlagged: true})
            WITH totalCustomers, totalTransactions, COUNT(t2) AS flaggedTransactions
            MATCH (c2:Customer {status: 'high_risk'})
            WITH totalCustomers, totalTransactions, flaggedTransactions, COUNT(c2) AS highRiskCustomers
            OPTIONAL MATCH (:Account)-[r:TRANSFERRED_TO]->(:Account)
            WITH totalCustomers, totalTransactions, flaggedTransactions, highRiskCustomers, COALESCE(SUM(r.amount), 0) AS totalTransferAmount
            MATCH (c3:Customer)
            RETURN totalCustomers, totalTransactions, flaggedTransactions, highRiskCustomers, totalTransferAmount, COALESCE(AVG(c3.riskScore), 0) AS avgRiskScore
        `);
        
        const record = result.records[0];
        res.json({
            totalCustomers: record.get('totalCustomers').toNumber(),
            totalTransactions: record.get('totalTransactions').toNumber(),
            flaggedTransactions: record.get('flaggedTransactions').toNumber(),
            highRiskCustomers: record.get('highRiskCustomers').toNumber(),
            totalTransferAmount: record.get('totalTransferAmount').toNumber(),
            avgRiskScore: parseFloat(record.get('avgRiskScore').toFixed(1))
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    } finally {
        await session.close();
    }
});

// High Risk Alerts
app.get('/api/dashboard/high-risk-alerts', requireAuth, async (req, res) => {
    const session = driver.session();
    
    try {
        const result = await session.run(`
            MATCH (c:Customer)
            WHERE c.riskScore >= 40
            RETURN c.id AS id, c.name AS name, c.riskScore AS riskScore, c.status AS status
            ORDER BY c.riskScore DESC
            LIMIT 10
        `);
        
        const alerts = result.records.map(record => ({
            id: record.get('id'),
            name: record.get('name'),
            riskScore: record.get('riskScore').toNumber(),
            status: record.get('status')
        }));
        
        res.json(alerts);
    } catch (error) {
        console.error('Alerts error:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    } finally {
        await session.close();
    }
});

// Risk Distribution
app.get('/api/dashboard/risk-distribution', requireAuth, async (req, res) => {
    const session = driver.session();
    
    try {
        const result = await session.run(`
            MATCH (c:Customer)
            RETURN 
                SUM(CASE WHEN c.riskScore >= 70 THEN 1 ELSE 0 END) AS high,
                SUM(CASE WHEN c.riskScore >= 40 AND c.riskScore < 70 THEN 1 ELSE 0 END) AS medium,
                SUM(CASE WHEN c.riskScore < 40 THEN 1 ELSE 0 END) AS low
        `);
        
        const record = result.records[0];
        res.json({
            high: record.get('high').toNumber(),
            medium: record.get('medium').toNumber(),
            low: record.get('low').toNumber()
        });
    } catch (error) {
        console.error('Risk distribution error:', error);
        res.status(500).json({ error: 'Failed to fetch risk distribution' });
    } finally {
        await session.close();
    }
});
// Get all customers
app.get('/api/customers', requireAuth, async (req, res) => {
    const session = driver.session();
    
    try {
        const result = await session.run(`
            MATCH (c:Customer)
            RETURN c.id AS id, c.name AS name, c.email AS email, c.phone AS phone, 
                   c.riskScore AS riskScore, c.status AS status, c.joinDate AS joinDate
            ORDER BY c.id
        `);
        
        const customers = result.records.map(record => ({
            id: record.get('id'),
            name: record.get('name'),
            email: record.get('email'),
            phone: record.get('phone'),
            riskScore: record.get('riskScore').toNumber(),
            status: record.get('status'),
            joinDate: record.get('joinDate')
        }));
        
        res.json(customers);
    } catch (error) {
        console.error('Customers error:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    } finally {
        await session.close();
    }
});

// Search customers
app.get('/api/customers/search', requireAuth, async (req, res) => {
    const { q } = req.query;
    const session = driver.session();
    
    try {
        const result = await session.run(`
            MATCH (c:Customer)
            WHERE c.id CONTAINS $q OR c.name CONTAINS $q OR c.email CONTAINS $q OR c.phone CONTAINS $q
            RETURN c.id AS id, c.name AS name, c.email AS email, c.phone AS phone, 
                   c.riskScore AS riskScore, c.status AS status, c.joinDate AS joinDate
            ORDER BY c.id
        `, { q });
        
        const customers = result.records.map(record => ({
            id: record.get('id'),
            name: record.get('name'),
            email: record.get('email'),
            phone: record.get('phone'),
            riskScore: record.get('riskScore').toNumber(),
            status: record.get('status'),
            joinDate: record.get('joinDate')
        }));
        
        res.json(customers);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Failed to search customers' });
    } finally {
        await session.close();
    }
});

// Get customer by ID with accounts and transactions
app.get('/api/customers/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const session = driver.session();
    
    try {
        // Get customer details
        const customerResult = await session.run(`
            MATCH (c:Customer {id: $id})
            RETURN c.id AS id, c.name AS name, c.email AS email, c.phone AS phone, 
                   c.riskScore AS riskScore, c.status AS status, c.joinDate AS joinDate
        `, { id });
        
        if (customerResult.records.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        const customer = customerResult.records[0];
        
        // Get customer's accounts
        const accountsResult = await session.run(`
            MATCH (c:Customer {id: $id})-[:OWNS]->(a:Account)
            RETURN a.accountNumber AS accountNumber, a.type AS type, a.balance AS balance, 
                   a.status AS status, a.isFlagged AS isFlagged
        `, { id });
        
        const accounts = accountsResult.records.map(record => ({
            accountNumber: record.get('accountNumber').toNumber(),
            type: record.get('type'),
            balance: record.get('balance').toNumber(),
            status: record.get('status'),
            isFlagged: record.get('isFlagged')
        }));
        
        // Get customer's transactions
        const transactionsResult = await session.run(`
            MATCH (c:Customer {id: $id})-[:OWNS]->(a:Account)-[:MADE]->(t:Transaction)
            RETURN t.transactionId AS transactionId, t.amount AS amount, t.type AS type, 
                   t.timestamp AS timestamp, t.isFlagged AS isFlagged
            ORDER BY t.timestamp DESC
            LIMIT 20
        `, { id });
        
        const transactions = transactionsResult.records.map(record => ({
            transactionId: record.get('transactionId'),
            amount: record.get('amount').toNumber(),
            type: record.get('type'),
            timestamp: record.get('timestamp'),
            isFlagged: record.get('isFlagged')
        }));
        
        res.json({
            id: customer.get('id'),
            name: customer.get('name'),
            email: customer.get('email'),
            phone: customer.get('phone'),
            riskScore: customer.get('riskScore').toNumber(),
            status: customer.get('status'),
            joinDate: customer.get('joinDate'),
            accounts: accounts,
            transactions: transactions
        });
    } catch (error) {
        console.error('Customer detail error:', error);
        res.status(500).json({ error: 'Failed to fetch customer details' });
    } finally {
        await session.close();
    }
});

// Fraud Alerts Endpoint
app.get('/api/fraud-alerts', requireAuth, async (req, res) => {
    const session = driver.session();
    
    try {
        const alerts = [];
        
        // Get flagged transactions (High Risk)
        const flaggedResult = await session.run(`
            MATCH (t:Transaction {isFlagged: true})<-[:MADE]-(a:Account)<-[:OWNS]-(c:Customer)
            RETURN t.transactionId AS transactionId, t.amount AS amount, t.timestamp AS timestamp,
                   c.name AS customerName, c.id AS customerId, a.accountNumber AS accountNumber
            ORDER BY t.timestamp DESC
            LIMIT 10
        `);
        
        flaggedResult.records.forEach(record => {
            const timestamp = record.get('timestamp');
            const timestampStr = typeof timestamp === 'object' && timestamp.toString ? timestamp.toString() : new Date().toISOString();
            alerts.push({
                id: 'FLAGGED_' + record.get('transactionId'),
                type: 'FLAGGED_TRANSACTION',
                severity: 'HIGH',
                message: `Transaction of $${record.get('amount').toNumber().toFixed(2)} by ${record.get('customerName')} (Account: ${record.get('accountNumber')}) flagged for manual review`,
                customer: record.get('customerName'),
                timestamp: timestampStr,
                amount: record.get('amount').toNumber()
            });
        });
        
        // Get high-risk customers with suspicious activity
        const highRiskResult = await session.run(`
            MATCH (c:Customer)
            WHERE c.riskScore >= 70
            OPTIONAL MATCH (c)-[:OWNS]->(a:Account)-[:MADE]->(t:Transaction)
            WITH c, COUNT(t) as transactionCount
            WHERE transactionCount > 20
            RETURN c.name AS name, c.id AS id, c.riskScore AS riskScore, transactionCount
            ORDER BY c.riskScore DESC
            LIMIT 5
        `);
        
        highRiskResult.records.forEach(record => {
            alerts.push({
                id: 'HIGH_RISK_' + record.get('id'),
                type: 'HIGH_RISK_CUSTOMER',
                severity: 'CRITICAL',
                message: `Customer ${record.get('name')} has critical risk score (${record.get('riskScore').toNumber()}) with ${record.get('transactionCount')} transactions`,
                customer: record.get('name'),
                timestamp: new Date().toISOString(),
                riskScore: record.get('riskScore').toNumber()
            });
        });
        
        // Get circular transaction patterns (potential money laundering)
        const circularResult = await session.run(`
            MATCH (a1:Account)-[r1:TRANSFERRED_TO]->(a2:Account)-[r2:TRANSFERRED_TO]->(a1)
            WHERE r1.timestamp > datetime().epochMillis - 86400000
            MATCH (a1)<-[:OWNS]-(c1:Customer), (a2)<-[:OWNS]-(c2:Customer)
            RETURN c1.name AS customer1, c2.name AS customer2, r1.amount AS amount1, r2.amount AS amount2
            LIMIT 5
        `);
        
        circularResult.records.forEach(record => {
            alerts.push({
                id: 'CIRCULAR_' + Date.now() + Math.random(),
                type: 'CIRCULAR_TRANSACTION',
                severity: 'CRITICAL',
                message: `Suspicious circular transfer pattern detected: ${record.get('customer1')} → ${record.get('customer2')} → ${record.get('customer1')} (Potential money laundering)`,
                customers: [record.get('customer1'), record.get('customer2')],
                timestamp: new Date().toISOString(),
                amounts: [record.get('amount1').toNumber(), record.get('amount2').toNumber()]
            });
        });
        
        // Get large transactions (potential structuring)
        const largeTransResult = await session.run(`
            MATCH (t:Transaction)
            WHERE t.amount > 50000
            MATCH (a:Account {transactionId: t.transactionId})<-[:OWNS]-(c:Customer)
            RETURN t.transactionId AS transactionId, t.amount AS amount, t.timestamp AS timestamp,
                   c.name AS customerName
            ORDER BY t.amount DESC
            LIMIT 5
        `);
        
        largeTransResult.records.forEach(record => {
            const timestamp = record.get('timestamp');
            const timestampStr = typeof timestamp === 'object' && timestamp.toString ? timestamp.toString() : new Date().toISOString();
            alerts.push({
                id: 'LARGE_TRANS_' + record.get('transactionId'),
                type: 'LARGE_TRANSACTION',
                severity: 'MEDIUM',
                message: `Large transaction detected: $${record.get('amount').toNumber().toFixed(2)} by ${record.get('customerName')}`,
                customer: record.get('customerName'),
                timestamp: timestampStr,
                amount: record.get('amount').toNumber()
            });
        });
        
        // Sort by severity and timestamp
        const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        alerts.sort((a, b) => {
            const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
            if (sevDiff !== 0) return sevDiff;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        res.json(alerts);
    } catch (error) {
        console.error('Fraud alerts error:', error);
        res.status(500).json({ error: 'Failed to fetch fraud alerts' });
    } finally {
        await session.close();
    }
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});