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
            MATCH (c2:Customer WHERE c2.status = 'high_risk' OR c2.riskScore >= 15)
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
            WHERE c.riskScore >= 15 OR c.status = 'medium_risk' OR c.status = 'high_risk'
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
                SUM(CASE WHEN c.riskScore >= 30 OR c.status = 'high_risk' THEN 1 ELSE 0 END) AS high,
                SUM(CASE WHEN c.riskScore >= 15 AND c.riskScore < 30 OR c.status = 'medium_risk' THEN 1 ELSE 0 END) AS medium,
                SUM(CASE WHEN c.riskScore < 15 OR c.riskScore = 0 THEN 1 ELSE 0 END) AS low
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
        const customerResult = await session.run(`
            MATCH (c:Customer {id: $id})
            RETURN c.id AS id, c.name AS name, c.email AS email, c.phone AS phone, 
                   c.riskScore AS riskScore, c.status AS status, c.joinDate AS joinDate
        `, { id });
        
        if (customerResult.records.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        const customer = customerResult.records[0];
        
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

// Fraud Alerts Endpoint - FIXED for actual data
app.get('/api/fraud-alerts', requireAuth, async (req, res) => {
    const session = driver.session();
    
    try {
        const alerts = [];
        
        // Get flagged transactions (these exist in your data)
        const flaggedResult = await session.run(`
            MATCH (t:Transaction {isFlagged: true})<-[:MADE]-(a:Account)<-[:OWNS]-(c:Customer)
            RETURN t.transactionId AS transactionId, t.amount AS amount, t.timestamp AS timestamp,
                   c.name AS customerName, c.id AS customerId, a.accountNumber AS accountNumber,
                   t.flagReason AS flagReason
            ORDER BY t.timestamp DESC
        `);
        
        flaggedResult.records.forEach(record => {
            const timestamp = record.get('timestamp');
            const timestampStr = timestamp ? timestamp.toString() : new Date().toISOString();
            alerts.push({
                id: 'FLAGGED_' + record.get('transactionId'),
                type: 'FLAGGED_TRANSACTION',
                severity: 'HIGH',
                message: `Transaction of $${record.get('amount').toNumber().toFixed(2)} by ${record.get('customerName')} flagged: ${record.get('flagReason') || 'Manual review required'}`,
                customer: record.get('customerName'),
                timestamp: timestampStr,
                amount: record.get('amount').toNumber()
            });
        });
        
        // Get customers with medium/high risk scores
        const riskCustomerResult = await session.run(`
            MATCH (c:Customer)
            WHERE c.riskScore >= 15 OR c.status = 'medium_risk' OR c.status = 'high_risk'
            RETURN c.name AS name, c.id AS id, c.riskScore AS riskScore, c.status AS status
            ORDER BY c.riskScore DESC
        `);
        
        riskCustomerResult.records.forEach(record => {
            const riskScore = record.get('riskScore').toNumber();
            let severity = 'MEDIUM';
            if (riskScore >= 30) severity = 'CRITICAL';
            else if (riskScore >= 15) severity = 'HIGH';
            
            alerts.push({
                id: 'RISK_CUST_' + record.get('id'),
                type: 'HIGH_RISK_CUSTOMER',
                severity: severity,
                message: `Customer ${record.get('name')} has risk score ${riskScore} (${record.get('status')})`,
                customer: record.get('name'),
                timestamp: new Date().toISOString(),
                riskScore: riskScore
            });
        });
        
        // Get money laundering paths (2+ hop transfers)
        const pathResult = await session.run(`
            MATCH path = (src:Account)-[:TRANSFERRED_TO*2..3]->(dst:Account)
            WHERE src <> dst
            RETURN src.accountNumber AS source, dst.accountNumber AS destination,
                   [node IN nodes(path) | node.accountNumber] AS path,
                   REDUCE(s = 0, r IN relationships(path) | s + r.amount) AS totalAmount
            LIMIT 5
        `);
        
        pathResult.records.forEach(record => {
            alerts.push({
                id: 'LAUNDERING_PATH_' + Date.now(),
                type: 'CIRCULAR_TRANSACTION',
                severity: 'HIGH',
                message: `Suspicious money flow detected: ${record.get('path').join(' → ')} (Total: $${record.get('totalAmount').toNumber().toFixed(2)})`,
                customers: record.get('path'),
                timestamp: new Date().toISOString(),
                amount: record.get('totalAmount').toNumber()
            });
        });
        
        // Sort by severity
        const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
        
        res.json(alerts);
    } catch (error) {
        console.error('Fraud alerts error:', error);
        res.status(500).json({ error: 'Failed to fetch fraud alerts' });
    } finally {
        await session.close();
    }
});

// Network Data - Get all nodes and edges for visualization
app.get('/api/network/data', requireAuth, async (req, res) => {
    const session = driver.session();
    
    try {
        const nodesResult = await session.run(`
            MATCH (c:Customer)
            RETURN 'Customer' AS type, c.id AS id, c.name AS label, c.riskScore AS riskScore, 
                   NULL AS isFlagged, NULL AS amount, c.status AS status
            UNION ALL
            MATCH (a:Account)
            RETURN 'Account' AS type, toString(a.accountNumber) AS id, toString(a.accountNumber) AS label,
                   NULL AS riskScore, a.isFlagged AS isFlagged, NULL AS amount, a.status AS status
            UNION ALL
            MATCH (t:Transaction)
            RETURN 'Transaction' AS type, t.transactionId AS id, t.transactionId AS label,
                   NULL AS riskScore, t.isFlagged AS isFlagged, t.amount AS amount, NULL AS status
            UNION ALL
            MATCH (d:Device)
            RETURN 'Device' AS type, d.deviceId AS id, d.deviceId AS label,
                   NULL AS riskScore, NULL AS isFlagged, NULL AS amount, NULL AS status
            UNION ALL
            MATCH (i:IPAddress)
            RETURN 'IPAddress' AS type, i.address AS id, i.address AS label,
                   NULL AS riskScore, i.isVPN AS isFlagged, NULL AS amount, NULL AS status
            UNION ALL
            MATCH (l:Location)
            RETURN 'Location' AS type, l.city + ',' + l.country AS id, l.city + ',' + l.country AS label,
                   NULL AS riskScore, CASE WHEN l.riskLevel = 'high' THEN true ELSE false END AS isFlagged,
                   NULL AS amount, NULL AS status
        `);
        
        const nodes = nodesResult.records.map(record => ({
            id: record.get('id'),
            type: record.get('type'),
            label: record.get('label'),
            riskScore: record.get('riskScore') ? record.get('riskScore').toNumber() : null,
            isFlagged: record.get('isFlagged') || false,
            amount: record.get('amount') ? record.get('amount').toNumber() : null,
            status: record.get('status')
        }));
        
        const edgesResult = await session.run(`
            MATCH (source)-[r]->(target)
            WHERE (source:Customer OR source:Account OR source:Transaction OR source:Device OR source:IPAddress OR source:Location)
              AND (target:Customer OR target:Account OR target:Transaction OR target:Device OR target:IPAddress OR target:Location)
            RETURN 
                CASE 
                    WHEN source:Customer THEN source.id
                    WHEN source:Account THEN toString(source.accountNumber)
                    WHEN source:Transaction THEN source.transactionId
                    WHEN source:Device THEN source.deviceId
                    WHEN source:IPAddress THEN source.address
                    WHEN source:Location THEN source.city + ',' + source.country
                END AS source,
                CASE 
                    WHEN target:Customer THEN target.id
                    WHEN target:Account THEN toString(target.accountNumber)
                    WHEN target:Transaction THEN target.transactionId
                    WHEN target:Device THEN target.deviceId
                    WHEN target:IPAddress THEN target.address
                    WHEN target:Location THEN target.city + ',' + target.country
                END AS target,
                type(r) AS relationship,
                r.amount AS amount
        `);
        
        const edges = edgesResult.records.map(record => ({
            source: record.get('source'),
            target: record.get('target'),
            relationship: record.get('relationship'),
            amount: record.get('amount') ? record.get('amount').toNumber() : null
        }));
        
        res.json({ nodes, edges });
    } catch (error) {
        console.error('Network data error:', error);
        res.status(500).json({ error: 'Failed to fetch network data' });
    } finally {
        await session.close();
    }
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});