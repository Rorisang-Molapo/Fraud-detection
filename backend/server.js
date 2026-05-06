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
            `MATCH (u:User {username: $username, password: $password}) RETURN u.username AS username, u.role AS role`,
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
            MATCH (c:Customer) WITH COUNT(c) AS totalCustomers
            MATCH (t:Transaction) WITH totalCustomers, COUNT(t) AS totalTransactions
            MATCH (t2:Transaction {isFlagged: true}) WITH totalCustomers, totalTransactions, COUNT(t2) AS flaggedTransactions
            MATCH (c2:Customer) WHERE c2.status = 'high_risk' OR c2.riskScore >= 15 WITH totalCustomers, totalTransactions, flaggedTransactions, COUNT(c2) AS highRiskCustomers
            OPTIONAL MATCH (:Account)-[r:TRANSFERRED_TO]->(:Account) WITH totalCustomers, totalTransactions, flaggedTransactions, highRiskCustomers, COALESCE(SUM(r.amount), 0) AS totalTransferAmount
            MATCH (c3:Customer) RETURN totalCustomers, totalTransactions, flaggedTransactions, highRiskCustomers, totalTransferAmount, COALESCE(AVG(c3.riskScore), 0) AS avgRiskScore
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
            MATCH (c:Customer) WHERE c.riskScore >= 15 OR c.status = 'medium_risk' OR c.status = 'high_risk'
            RETURN c.id AS id, c.name AS name, c.riskScore AS riskScore, c.status AS status ORDER BY c.riskScore DESC LIMIT 10
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
            MATCH (c:Customer) RETURN 
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
            MATCH (c:Customer) RETURN c.id AS id, c.name AS name, c.email AS email, c.phone AS phone, 
            c.riskScore AS riskScore, c.status AS status, c.joinDate AS joinDate ORDER BY c.id
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
            MATCH (c:Customer) WHERE c.id CONTAINS $q OR c.name CONTAINS $q OR c.email CONTAINS $q OR c.phone CONTAINS $q
            RETURN c.id AS id, c.name AS name, c.email AS email, c.phone AS phone, 
            c.riskScore AS riskScore, c.status AS status, c.joinDate AS joinDate ORDER BY c.id
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
            MATCH (c:Customer {id: $id}) RETURN c.id AS id, c.name AS name, c.email AS email, c.phone AS phone, 
            c.riskScore AS riskScore, c.status AS status, c.joinDate AS joinDate
        `, { id });
        if (customerResult.records.length === 0) return res.status(404).json({ error: 'Customer not found' });
        const customer = customerResult.records[0];

        const accountsResult = await session.run(`
            MATCH (c:Customer {id: $id})-[:OWNS]->(a:Account)
            RETURN a.accountNumber AS accountNumber, a.type AS type, a.balance AS balance, a.status AS status, a.isFlagged AS isFlagged
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
            t.timestamp AS timestamp, t.isFlagged AS isFlagged ORDER BY t.timestamp DESC LIMIT 20
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
            accounts, transactions
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
        const flaggedResult = await session.run(`
            MATCH (t:Transaction {isFlagged: true})<-[:MADE]-(a:Account)<-[:OWNS]-(c:Customer)
            RETURN t.transactionId AS transactionId, t.amount AS amount, t.timestamp AS timestamp,
            c.name AS customerName, c.id AS customerId, a.accountNumber AS accountNumber, t.flagReason AS flagReason
            ORDER BY t.timestamp DESC
        `);
        flaggedResult.records.forEach(record => {
            alerts.push({
                id: 'FLAGGED_' + record.get('transactionId'),
                type: 'FLAGGED_TRANSACTION',
                severity: 'HIGH',
                message: `Transaction of $${record.get('amount').toNumber().toFixed(2)} by ${record.get('customerName')} flagged: ${record.get('flagReason') || 'Manual review required'}`,
                customer: record.get('customerName'),
                timestamp: record.get('timestamp') ? record.get('timestamp').toString() : new Date().toISOString(),
                amount: record.get('amount').toNumber()
            });
        });

        const riskCustomerResult = await session.run(`
            MATCH (c:Customer) WHERE c.riskScore >= 15 OR c.status = 'medium_risk' OR c.status = 'high_risk'
            RETURN c.name AS name, c.id AS id, c.riskScore AS riskScore, c.status AS status ORDER BY c.riskScore DESC
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

        const pathResult = await session.run(`
            MATCH path = (src:Account)-[:TRANSFERRED_TO*2..3]->(dst:Account) WHERE src <> dst
            RETURN src.accountNumber AS source, dst.accountNumber AS destination,
            [node IN nodes(path) | node.accountNumber] AS path,
            REDUCE(s = 0, r IN relationships(path) | s + r.amount) AS totalAmount LIMIT 5
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

// Network data endpoint
app.get('/api/network/data', requireAuth, async (req, res) => {
    const session = driver.session();
    try {
        const nodesResult = await session.run(`
            MATCH (c:Customer) RETURN 'Customer' AS type, c.id AS id, c.name AS label, c.riskScore AS riskScore, NULL AS isFlagged, NULL AS amount, c.status AS status
            UNION ALL MATCH (a:Account) RETURN 'Account' AS type, toString(a.accountNumber) AS id, toString(a.accountNumber) AS label, NULL AS riskScore, a.isFlagged AS isFlagged, NULL AS amount, a.status AS status
            UNION ALL MATCH (t:Transaction) RETURN 'Transaction' AS type, t.transactionId AS id, t.transactionId AS label, NULL AS riskScore, t.isFlagged AS isFlagged, t.amount AS amount, NULL AS status
            UNION ALL MATCH (d:Device) RETURN 'Device' AS type, d.deviceId AS id, d.deviceId AS label, NULL AS riskScore, NULL AS isFlagged, NULL AS amount, NULL AS status
            UNION ALL MATCH (i:IPAddress) RETURN 'IPAddress' AS type, i.address AS id, i.address AS label, NULL AS riskScore, i.isVPN AS isFlagged, NULL AS amount, NULL AS status
            UNION ALL MATCH (l:Location) RETURN 'Location' AS type, l.city + ',' + l.country AS id, l.city + ',' + l.country AS label, NULL AS riskScore, CASE WHEN l.riskLevel = 'high' THEN true ELSE false END AS isFlagged, NULL AS amount, NULL AS status
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
            MATCH (source)-[r]->(target) WHERE (source:Customer OR source:Account OR source:Transaction OR source:Device OR source:IPAddress OR source:Location) AND (target:Customer OR target:Account OR target:Transaction OR target:Device OR target:IPAddress OR target:Location)
            RETURN CASE WHEN source:Customer THEN source.id WHEN source:Account THEN toString(source.accountNumber) WHEN source:Transaction THEN source.transactionId WHEN source:Device THEN source.deviceId WHEN source:IPAddress THEN source.address WHEN source:Location THEN source.city + ',' + source.country END AS source,
            CASE WHEN target:Customer THEN target.id WHEN target:Account THEN toString(target.accountNumber) WHEN target:Transaction THEN target.transactionId WHEN target:Device THEN target.deviceId WHEN target:IPAddress THEN target.address WHEN target:Location THEN target.city + ',' + target.country END AS target,
            type(r) AS relationship, r.amount AS amount
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

// report endpoints

// Get flagged transactions for reports
app.get('/api/transactions/flagged', requireAuth, async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (t:Transaction {isFlagged: true})<-[:MADE]-(a:Account)
            OPTIONAL MATCH (t)-[:FROM_IP]->(ip:IPAddress)
            OPTIONAL MATCH (t)-[:OCCURRED_AT]->(l:Location)
            RETURN t.transactionId AS id, 
                   t.amount AS amount, 
                   t.type AS type, 
                   t.timestamp AS timestamp,
                   t.flagReason AS reason,
                   a.accountNumber AS accountNumber,
                   l.city AS location,
                   ip.address AS ipAddress,
                   ip.isVPN AS usedVPN
            ORDER BY t.timestamp DESC
        `);
        
        const flaggedTransactions = result.records.map(record => ({
            id: record.get('id'),
            amount: record.get('amount').toNumber(),
            type: record.get('type'),
            timestamp: record.get('timestamp'),
            reason: record.get('reason') || 'Manual review required',
            accountNumber: record.get('accountNumber') ? record.get('accountNumber').toNumber() : 'N/A',
            location: record.get('location') || 'Unknown',
            ipAddress: record.get('ipAddress') || 'Unknown',
            usedVPN: record.get('usedVPN') || false
        }));
        
        res.json(flaggedTransactions);
    } catch (error) {
        console.error('Flagged transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch flagged transactions' });
    } finally {
        await session.close();
    }
});

// Get all transactions for reports
app.get('/api/transactions/all', requireAuth, async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (t:Transaction)<-[:MADE]-(a:Account)
            OPTIONAL MATCH (t)-[:OCCURRED_AT]->(l:Location)
            RETURN t.transactionId AS id, 
                   t.amount AS amount, 
                   t.type AS type, 
                   t.timestamp AS timestamp,
                   t.isFlagged AS isFlagged,
                   a.accountNumber AS accountNumber,
                   l.city AS location
            ORDER BY t.timestamp DESC
            LIMIT 50
        `);
        
        const transactions = result.records.map(record => ({
            id: record.get('id'),
            amount: record.get('amount').toNumber(),
            type: record.get('type'),
            timestamp: record.get('timestamp'),
            isFlagged: record.get('isFlagged'),
            accountNumber: record.get('accountNumber').toNumber(),
            location: record.get('location') || 'Unknown'
        }));
        
        res.json(transactions);
    } catch (error) {
        console.error('Transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    } finally {
        await session.close();
    }
});

// Get system summary stats
app.get('/api/system/summary', requireAuth, async (req, res) => {
    const session = driver.session();
    try {
        const customerResult = await session.run(`MATCH (c:Customer) RETURN COUNT(c) AS count`);
        const accountResult = await session.run(`MATCH (a:Account) RETURN COUNT(a) AS count`);
        const flaggedAccountResult = await session.run(`MATCH (a:Account {isFlagged: true}) RETURN COUNT(a) AS count`);
        const deviceResult = await session.run(`MATCH (d:Device) RETURN COUNT(d) AS count`);
        const ipResult = await session.run(`MATCH (i:IPAddress) RETURN COUNT(i) AS count`);
        const locationResult = await session.run(`MATCH (l:Location) RETURN COUNT(l) AS count`);
        const transactionResult = await session.run(`MATCH (t:Transaction) RETURN COUNT(t) AS count`);
        const flaggedTransactionResult = await session.run(`MATCH (t:Transaction {isFlagged: true}) RETURN COUNT(t) AS count`);
        
        res.json({
            totalCustomers: customerResult.records[0].get('count').toNumber(),
            totalAccounts: accountResult.records[0].get('count').toNumber(),
            flaggedAccounts: flaggedAccountResult.records[0].get('count').toNumber(),
            totalDevices: deviceResult.records[0].get('count').toNumber(),
            totalIPs: ipResult.records[0].get('count').toNumber(),
            totalLocations: locationResult.records[0].get('count').toNumber(),
            totalTransactions: transactionResult.records[0].get('count').toNumber(),
            flaggedTransactions: flaggedTransactionResult.records[0].get('count').toNumber()
        });
    } catch (error) {
        console.error('System summary error:', error);
        res.status(500).json({ error: 'Failed to fetch system summary' });
    } finally {
        await session.close();
    }
});

// Reports: Risk Distribution with averages
app.get('/api/reports/risk-distribution', requireAuth, async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (c:Customer)
            RETURN 
                SUM(CASE WHEN c.riskScore >= 30 OR c.status = 'high_risk' THEN 1 ELSE 0 END) AS highCount,
                SUM(CASE WHEN c.riskScore >= 15 AND c.riskScore < 30 OR c.status = 'medium_risk' THEN 1 ELSE 0 END) AS mediumCount,
                SUM(CASE WHEN c.riskScore < 15 OR c.riskScore = 0 THEN 1 ELSE 0 END) AS lowCount,
                AVG(CASE WHEN c.riskScore >= 30 OR c.status = 'high_risk' THEN c.riskScore ELSE NULL END) AS highAvg,
                AVG(CASE WHEN c.riskScore >= 15 AND c.riskScore < 30 OR c.status = 'medium_risk' THEN c.riskScore ELSE NULL END) AS mediumAvg,
                AVG(CASE WHEN c.riskScore < 15 OR c.riskScore = 0 THEN c.riskScore ELSE NULL END) AS lowAvg,
                COUNT(c) AS totalThreats,
                AVG(c.riskScore) AS overallAvg
        `);
        const record = result.records[0];
        res.json({
            high: { count: record.get('highCount').toNumber(), avgScore: parseFloat((record.get('highAvg') || 0).toFixed(1)) },
            medium: { count: record.get('mediumCount').toNumber(), avgScore: parseFloat((record.get('mediumAvg') || 0).toFixed(1)) },
            low: { count: record.get('lowCount').toNumber(), avgScore: parseFloat((record.get('lowAvg') || 0).toFixed(1)) },
            totalThreats: record.get('totalThreats').toNumber(),
            overallAvg: parseFloat((record.get('overallAvg') || 0).toFixed(1))
        });
    } catch (error) {
        console.error('Risk distribution report error:', error);
        res.status(500).json({ error: 'Failed to fetch risk distribution' });
    } finally {
        await session.close();
    }
});

// Reports: Money Mule Detection
app.get('/api/reports/money-mules', requireAuth, async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (incoming:Account)-[r1:TRANSFERRED_TO]->(mule:Account)
            MATCH (mule)-[r2:TRANSFERRED_TO]->(outgoing:Account)
            WHERE incoming <> outgoing AND mule <> incoming AND mule <> outgoing
            WITH mule.accountNumber AS entityId, 
                 COUNT(r1) + COUNT(r2) AS velocity,
                 SUM(r1.amount) + SUM(r2.amount) AS aggregateVol
            RETURN entityId, 
                   toString(velocity) + '/hr' AS velocity,
                   aggregateVol,
                   CASE WHEN aggregateVol > 10000 THEN 90 + (aggregateVol / 10000)
                        WHEN aggregateVol > 5000 THEN 70 + (aggregateVol / 10000)
                        ELSE 50 + (aggregateVol / 10000) END AS riskScore
            ORDER BY riskScore DESC
            LIMIT 5
        `);
        const mules = result.records.map(record => ({
            entityId: record.get('entityId'),
            velocity: record.get('velocity'),
            aggregateVol: record.get('aggregateVol').toNumber(),
            riskScore: Math.min(Math.floor(record.get('riskScore')), 100)
        }));
        res.json(mules);
    } catch (error) {
        console.error('Money mules error:', error);
        res.json([]);
    } finally {
        await session.close();
    }
});

// Reports: Impossible Travel Alerts
app.get('/api/reports/impossible-travel', requireAuth, async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (a:Account)-[:MADE]->(t1:Transaction)-[:OCCURRED_AT]->(l1:Location)
            MATCH (a)-[:MADE]->(t2:Transaction)-[:OCCURRED_AT]->(l2:Location)
            WHERE t1.timestamp < t2.timestamp AND l1.city <> l2.city
              AND duration.between(t1.timestamp, t2.timestamp) < duration({hours: 3})
            RETURN a.accountNumber AS accountId,
                   l1.city + ', ' + l1.country AS fromLocation,
                   l2.city + ', ' + l2.country AS toLocation,
                   toString(t1.timestamp) AS fromTime,
                   toString(t2.timestamp) AS toTime,
                   duration.between(t1.timestamp, t2.timestamp).hours AS hoursDiff
            LIMIT 3
        `);
        const travels = result.records.map((record, idx) => ({
            id: `UID-${Math.floor(Math.random() * 900000) + 100000}`,
            fromLocation: record.get('fromLocation'),
            toLocation: record.get('toLocation'),
            fromTime: record.get('fromTime').split('T')[1]?.substring(0, 8) || '00:00:00',
            toTime: record.get('toTime').split('T')[1]?.substring(0, 8) || '00:00:00',
            velocity: Math.floor(8000 / Math.max(record.get('hoursDiff'), 1)),
            riskLevel: record.get('hoursDiff') <= 1 ? 'CRITICAL' : 'HIGH'
        }));
        res.json(travels);
    } catch (error) {
        console.error('Impossible travel error:', error);
        res.json([]);
    } finally {
        await session.close();
    }
});

// Reports: VPN/Proxy Analysis
app.get('/api/reports/vpn-analysis', requireAuth, async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (t:Transaction)-[:FROM_IP]->(ip:IPAddress)
            WHERE ip.isVPN = true OR ip.isProxy = true
            RETURN COUNT(t) AS vpnTransactions,
                   COUNT(DISTINCT ip.address) AS vpnIPs
        `);
        const totalTransResult = await session.run(`MATCH (t:Transaction) RETURN COUNT(t) AS total`);
        const totalTrans = totalTransResult.records[0].get('total').toNumber() || 1;
        const vpnTrans = result.records[0].get('vpnTransactions').toNumber();
        
        res.json({
            totalVolume: Math.min(Math.floor((vpnTrans / totalTrans) * 100), 100),
            topService: 'NordVPN',
            topSessions: Math.floor(vpnTrans / 2),
            torNodes: Math.floor(vpnTrans / 3),
            criticalLevel: vpnTrans > 5 ? vpnTrans : 0
        });
    } catch (error) {
        console.error('VPN analysis error:', error);
        res.json({ totalVolume: 0, topService: 'None', topSessions: 0, torNodes: 0, criticalLevel: 0 });
    } finally {
        await session.close();
    }
});

// Reports: Suspicious Proxy Endpoints
app.get('/api/reports/proxy-endpoints', requireAuth, async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (ip:IPAddress)
            WHERE ip.isVPN = true OR ip.isProxy = true
            RETURN ip.address AS address,
                   CASE WHEN ip.isVPN = true AND ip.isProxy = true THEN 'Known Datacenter Exit Node'
                        WHEN ip.isVPN = true THEN 'Residential Proxy Network'
                        ELSE 'Cloudflare Warp User' END AS description
            LIMIT 3
        `);
        const endpoints = result.records.map(record => ({
            address: record.get('address'),
            description: record.get('description')
        }));
        res.json(endpoints);
    } catch (error) {
        console.error('Proxy endpoints error:', error);
        res.json([]);
    } finally {
        await session.close();
    }
});

// Get all transfers for reports
app.get('/api/transfers', requireAuth, async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (a1:Account)-[r:TRANSFERRED_TO]->(a2:Account)
            RETURN a1.accountNumber AS fromAccount, a2.accountNumber AS toAccount, 
                   r.amount AS amount, r.timestamp AS timestamp, r.reference AS reference
            ORDER BY r.timestamp DESC
        `);
        const transfers = result.records.map(record => ({
            fromAccount: record.get('fromAccount').toNumber(),
            toAccount: record.get('toAccount').toNumber(),
            amount: record.get('amount').toNumber(),
            timestamp: record.get('timestamp') ? record.get('timestamp').toString() : null,
            reference: record.get('reference')
        }));
        res.json(transfers);
    } catch (error) {
        console.error('Transfers error:', error);
        res.json([]);
    } finally {
        await session.close();
    }
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});