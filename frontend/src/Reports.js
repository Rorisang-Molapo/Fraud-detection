import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

const Reports = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('reports');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [flaggedTransactions, setFlaggedTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [systemSummary, setSystemSummary] = useState({
    totalCustomers: 0, totalAccounts: 0, flaggedAccounts: 0, totalDevices: 0,
    totalIPs: 0, totalLocations: 0, totalTransactions: 0, flaggedTransactions: 0
  });
  const [riskDistribution, setRiskDistribution] = useState({ high: 0, medium: 0, low: 0 });
  const [stats, setStats] = useState({
    totalCustomers: 0, totalTransactions: 0, flaggedTransactions: 0, highRiskCustomers: 0
  });

  const toNumber = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'object' && value.low !== undefined) return value.low;
    return Number(value);
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [customersRes, statsRes, flaggedRes, transactionsRes, summaryRes, riskDistRes] = await Promise.all([
        axios.get('http://localhost:5000/api/customers', { withCredentials: true }),
        axios.get('http://localhost:5000/api/dashboard/stats', { withCredentials: true }),
        axios.get('http://localhost:5000/api/transactions/flagged', { withCredentials: true }),
        axios.get('http://localhost:5000/api/transactions/all', { withCredentials: true }),
        axios.get('http://localhost:5000/api/system/summary', { withCredentials: true }),
        axios.get('http://localhost:5000/api/reports/risk-distribution', { withCredentials: true })
      ]);

      setCustomers(customersRes.data || []);
      setStats(statsRes.data);
      setFlaggedTransactions(flaggedRes.data || []);
      setAllTransactions(transactionsRes.data || []);
      setSystemSummary(summaryRes.data);
      
      const high = customersRes.data.filter(c => c.riskScore >= 30).length;
      const medium = customersRes.data.filter(c => c.riskScore >= 15 && c.riskScore < 30).length;
      const low = customersRes.data.filter(c => c.riskScore < 15 || c.riskScore === 0).length;
      setRiskDistribution({ high, medium, low });
    } catch (error) {
      console.error('Error fetching report data:', error);
      if (error.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/logout', {}, { withCredentials: true });
      navigate('/login');
    } catch (error) { console.error('Logout failed:', error); }
  };

  const handleNavigate = (page, path) => {
    setActivePage(page);
    if (path) setTimeout(() => navigate(path), 150);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const exportToCSV = () => {
    const customerRows = customers.map(c => `${c.id},${c.name},${c.email},${c.phone},${c.riskScore},normal`).join('\n');
    const flaggedRows = flaggedTransactions.map(t => `${t.id},${t.accountNumber},${t.amount},${t.type},${t.reason}`).join('\n');
    const csvContent = `FRAUD DETECTION REPORT\nGenerated: ${new Date().toLocaleString()}\n\n========================================\nCUSTOMERS\n========================================\nID,Name,Email,Phone,Risk Score,Status\n${customerRows}\n\n========================================\nFLAGGED TRANSACTIONS\n========================================\nID,Account Number,Amount,Type,Reason\n${flaggedRows}\n\n========================================\nSYSTEM SUMMARY\n========================================\nTotal Customers: ${systemSummary.totalCustomers}\nTotal Accounts: ${systemSummary.totalAccounts}\nFlagged Accounts: ${systemSummary.flaggedAccounts}\nTotal Transactions: ${systemSummary.totalTransactions}\nFlagged Transactions: ${systemSummary.flaggedTransactions}\nTotal Devices: ${systemSummary.totalDevices}\nTotal IP Addresses: ${systemSummary.totalIPs}\nTotal Locations: ${systemSummary.totalLocations}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `federal20_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printReport = () => window.print();

  const getRiskClass = (riskScore) => {
    if (riskScore >= 30) return 'risk-high-text';
    if (riskScore >= 15) return 'risk-medium-text';
    return 'risk-low-text';
  };

  const getSeverityBadge = (reason) => {
    if (reason && reason.toLowerCase().includes('vpn')) return 'badge-warning';
    if (reason && reason.toLowerCase().includes('threshold')) return 'badge-danger';
    return 'badge-info';
  };

  const pieData = [
    { name: 'High Risk (30+)', value: toNumber(riskDistribution.high), color: '#ef4444' },
    { name: 'Medium Risk (15-29)', value: toNumber(riskDistribution.medium), color: '#f59e0b' },
    { name: 'Low Risk (0-14)', value: toNumber(riskDistribution.low), color: '#10b981' }
  ].filter(item => item.value > 0);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (typeof timestamp === 'string') {
      const d = new Date(timestamp);
      return isNaN(d.getTime()) ? timestamp : d.toLocaleString();
    }
    return String(timestamp);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">LOADING FRAUD REPORTS...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-background-svg">
        <svg width="1200" viewBox="0 0 1000 500" fill="none" stroke="#3b82f6">
          <path d="M100,250 Q250,100 400,250 T700,250" strokeWidth="1" />
          <circle cx="500" cy="250" r="200" strokeWidth="0.5" strokeDasharray="5,5" />
        </svg>
      </div>

      <div className="sidebar" style={{ width: sidebarOpen ? '260px' : '60px' }}>
        <div className="sidebar-header">
          {sidebarOpen && <h2 className="sidebar-title">FEDERAL 20!</h2>}
          <button className="sidebar-toggle" onClick={toggleSidebar}>{sidebarOpen ? '<' : '>'}</button>
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => handleNavigate('dashboard', '/dashboard')} className={`nav-item ${activePage === 'dashboard' ? 'nav-item-active' : ''}`}>{sidebarOpen ? 'DASHBOARD' : 'DB'}</button>
          <button onClick={() => handleNavigate('customer', '/customer')} className={`nav-item ${activePage === 'customer' ? 'nav-item-active' : ''}`}>{sidebarOpen ? 'CUSTOMERS' : 'CU'}</button>
          <button onClick={() => handleNavigate('alerts', '/alerts')} className={`nav-item ${activePage === 'alerts' ? 'nav-item-active' : ''}`}>{sidebarOpen ? 'ALERTS' : 'AL'}</button>
          <button onClick={() => handleNavigate('network', '/network')} className={`nav-item ${activePage === 'network' ? 'nav-item-active' : ''}`}>{sidebarOpen ? 'NETWORK' : 'NW'}</button>
          <button onClick={() => handleNavigate('reports', '/reports')} className={`nav-item ${activePage === 'reports' ? 'nav-item-active' : ''}`}>{sidebarOpen ? 'REPORTS' : 'RP'}</button>
        </nav>
        <button onClick={handleLogout} className="logout-nav-item">{sidebarOpen ? 'LOGOUT' : 'LO'}</button>
      </div>

      <div className="main-wrapper" style={{ marginLeft: sidebarOpen ? '260px' : '60px' }}>
        <div className="reports-header">
          <div className="reports-header-left">
            <div className="reports-header-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div><h1 className="reports-header-title">FRAUD REPORTS</h1></div>
          </div>
          <div className="reports-header-right">
            <div className="export-buttons">
              <button className="export-csv-btn" onClick={exportToCSV}>EXPORT CSV</button>
              <button className="export-print-btn" onClick={printReport}>PRINT</button>
            </div>
          </div>
        </div>

        <div className="reports-stats-row">
          <div className="reports-stat-card"><div className="reports-stat-label">TOTAL CUSTOMERS</div><div className="reports-stat-value">{toNumber(systemSummary.totalCustomers)}</div></div>
          <div className="reports-stat-card"><div className="reports-stat-label">TOTAL ACCOUNTS</div><div className="reports-stat-value">{toNumber(systemSummary.totalAccounts)}</div></div>
          <div className="reports-stat-card"><div className="reports-stat-label">TOTAL TRANSACTIONS</div><div className="reports-stat-value">{toNumber(systemSummary.totalTransactions)}</div></div>
          <div className="reports-stat-card"><div className="reports-stat-label">FLAGGED TRANSACTIONS</div><div className="reports-stat-value" style={{ color: '#ef4444' }}>{toNumber(systemSummary.flaggedTransactions)}</div></div>
        </div>

        <div className="reports-stats-row">
          <div className="reports-stat-card"><div className="reports-stat-label">HIGH RISK CUSTOMERS</div><div className="reports-stat-value" style={{ color: '#ef4444' }}>{toNumber(riskDistribution.high)}</div></div>
          <div className="reports-stat-card"><div className="reports-stat-label">MEDIUM RISK CUSTOMERS</div><div className="reports-stat-value" style={{ color: '#f59e0b' }}>{toNumber(riskDistribution.medium)}</div></div>
          <div className="reports-stat-card"><div className="reports-stat-label">FLAGGED ACCOUNTS</div><div className="reports-stat-value" style={{ color: '#ef4444' }}>{toNumber(systemSummary.flaggedAccounts)}</div></div>
          <div className="reports-stat-card"><div className="reports-stat-label">DEVICES MONITORED</div><div className="reports-stat-value">{toNumber(systemSummary.totalDevices)}</div></div>
        </div>

        <div className="reports-two-column">
          <div className="reports-left-column">
            <div className="reports-card">
              <div className="reports-card-header"><h3>RISK DISTRIBUTION</h3></div>
              {pieData.length > 0 ? (
                <>
                  <div className="risk-stats-summary">
                    <div className="risk-stat-item"><span className="risk-dot high"></span><span>High Risk (30+):</span><span className="risk-number">{toNumber(riskDistribution.high)}</span></div>
                    <div className="risk-stat-item"><span className="risk-dot medium"></span><span>Medium Risk (15-29):</span><span className="risk-number">{toNumber(riskDistribution.medium)}</span></div>
                    <div className="risk-stat-item"><span className="risk-dot low"></span><span>Low Risk (0-14):</span><span className="risk-number">{toNumber(riskDistribution.low)}</span></div>
                  </div>
                  <div className="risk-chart-container">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                          {pieData.map((entry, idx) => <Cell key={`cell-${idx}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#11141d', borderColor: '#3b82f6' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : <div className="no-data">No customer data available</div>}
            </div>

            <div className="reports-card">
              <div className="reports-card-header"><h3>ALL CUSTOMERS</h3></div>
              <div className="customer-table-container">
                {customers.length > 0 ? (
                  <table className="reports-table">
                    <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Risk Score</th><th>Status</th></tr></thead>
                    <tbody>
                      {customers.map(customer => (
                        <tr key={toNumber(customer.id)}>
                          <td>{toNumber(customer.id)}</td><td>{customer.name}</td><td>{customer.email}</td>
                          <td className={getRiskClass(customer.riskScore)}>{toNumber(customer.riskScore)}</td>
                          <td>{(customer.status || 'normal').toUpperCase()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div className="no-data">No customers found</div>}
              </div>
            </div>
          </div>

          <div className="reports-right-column">
            <div className="reports-card">
              <div className="reports-card-header"><h3>FLAGGED TRANSACTIONS</h3></div>
              <div className="transaction-table-container">
                {flaggedTransactions.length > 0 ? (
                  <table className="reports-table">
                    <thead><tr><th>Transaction ID</th><th>Account</th><th>Amount</th><th>Type</th><th>Reason</th><th>Date</th></tr></thead>
                    <tbody>
                      {flaggedTransactions.map(transaction => (
                        <tr key={toNumber(transaction.id)}>
                          <td><code>{toNumber(transaction.id)}</code></td><td>{toNumber(transaction.accountNumber)}</td>
                          <td style={{ color: '#ef4444', fontWeight: 'bold' }}>${toNumber(transaction.amount).toLocaleString()}</td>
                          <td>{transaction.type?.toUpperCase() || 'TRANSFER'}</td>
                          <td><span className={`severity-badge ${getSeverityBadge(transaction.reason)}`}>{transaction.reason}</span></td>
                          <td>{formatDate(transaction.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div className="no-data">No flagged transactions found</div>}
              </div>
            </div>

            <div className="reports-card">
              <div className="reports-card-header"><h3>RECENT TRANSACTIONS</h3></div>
              <div className="transaction-table-container">
                {allTransactions.length > 0 ? (
                  <table className="reports-table">
                    <thead><tr><th>ID</th><th>Account</th><th>Amount</th><th>Type</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                      {allTransactions.slice(0, 10).map(transaction => (
                        <tr key={toNumber(transaction.id)}>
                          <td><code>{toNumber(transaction.id)}</code></td><td>{toNumber(transaction.accountNumber)}</td>
                          <td>${toNumber(transaction.amount).toLocaleString()}</td>
                          <td>{transaction.type?.toUpperCase() || 'TRANSFER'}</td>
                          <td><span className={transaction.isFlagged ? 'status-flagged' : 'status-normal'}>{transaction.isFlagged ? 'FLAGGED' : 'NORMAL'}</span></td>
                          <td>{formatDate(transaction.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div className="no-data">No transactions found</div>}
              </div>
            </div>

            <div className="reports-card">
              <div className="reports-card-header"><h3>SYSTEM SUMMARY</h3></div>
              <div className="summary-stats">
                <div className="summary-item"><span className="summary-label">Database Nodes:</span><span className="summary-value">{toNumber(systemSummary.totalCustomers + systemSummary.totalAccounts + systemSummary.totalTransactions + systemSummary.totalDevices + systemSummary.totalIPs + systemSummary.totalLocations)}</span></div>
                <div className="summary-item"><span className="summary-label">Active Accounts:</span><span className="summary-value">{toNumber(systemSummary.totalAccounts - systemSummary.flaggedAccounts)}</span></div>
                <div className="summary-item"><span className="summary-label">Flagged Accounts:</span><span className="summary-value">{toNumber(systemSummary.flaggedAccounts)}</span></div>
                <div className="summary-item"><span className="summary-label">Device Count:</span><span className="summary-value">{toNumber(systemSummary.totalDevices)}</span></div>
                <div className="summary-item"><span className="summary-label">IP Addresses Monitored:</span><span className="summary-value">{toNumber(systemSummary.totalIPs)}</span></div>
                <div className="summary-item"><span className="summary-label">Locations Tracked:</span><span className="summary-value">{toNumber(systemSummary.totalLocations)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;