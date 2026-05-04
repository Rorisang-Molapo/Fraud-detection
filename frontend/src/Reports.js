import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

const Reports = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('reports');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalTransactions: 0,
    flaggedTransactions: 0,
    highRiskCustomers: 0,
    totalTransferAmount: 0,
    avgRiskScore: 0
  });
  const [riskDistribution, setRiskDistribution] = useState({
    high: 0,
    medium: 0,
    low: 0
  });
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [highRiskAlerts, setHighRiskAlerts] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      const [statsRes, riskRes, alertsRes, customersRes, highRiskRes] = await Promise.all([
        axios.get('http://localhost:5000/api/dashboard/stats', { withCredentials: true }),
        axios.get('http://localhost:5000/api/dashboard/risk-distribution', { withCredentials: true }),
        axios.get('http://localhost:5000/api/fraud-alerts', { withCredentials: true }),
        axios.get('http://localhost:5000/api/customers', { withCredentials: true }),
        axios.get('http://localhost:5000/api/dashboard/high-risk-alerts', { withCredentials: true })
      ]);

      setStats(statsRes.data);
      setRiskDistribution(riskRes.data);
      setFraudAlerts(alertsRes.data || []);
      setCustomers(customersRes.data || []);
      setHighRiskAlerts(highRiskRes.data || []);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/logout', {}, {
        withCredentials: true
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavigate = (page, path) => {
    setActivePage(page);
    if (path) {
      setTimeout(() => {
        navigate(path);
      }, 150);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Export to CSV
  const exportToCSV = () => {
    setExporting(true);
    
    // Prepare customer data for CSV
    const customerCSV = customers.map(c => ({
      'Customer ID': c.id,
      'Name': c.name,
      'Email': c.email,
      'Phone': c.phone,
      'Risk Score': c.riskScore,
      'Status': (c.status || 'normal').replace('_', ' ').toUpperCase()
    }));
    
    // Prepare alert data for CSV
    const alertCSV = fraudAlerts.map(a => ({
      'Alert Type': a.type.replace('_', ' ').toUpperCase(),
      'Severity': a.severity,
      'Message': a.message,
      'Date': new Date(a.timestamp).toLocaleString()
    }));
    
    // Convert to CSV strings
    const customerRows = customerCSV.map(row => Object.values(row).join(',')).join('\n');
    const alertRows = alertCSV.map(row => Object.values(row).join(',')).join('\n');
    
    const customerHeaders = Object.keys(customerCSV[0] || {}).join(',');
    const alertHeaders = Object.keys(alertCSV[0] || {}).join(',');
    
    const csvContent = `=== CUSTOMER REPORT ===\n${customerHeaders}\n${customerRows}\n\n=== FRAUD ALERTS REPORT ===\n${alertHeaders}\n${alertRows}\n\nGenerated: ${new Date().toLocaleString()}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `federal20_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setExporting(false);
  };

  // Print report
  const printReport = () => {
    window.print();
  };

  // Prepare data for charts
  const riskPieData = [
    { name: 'High Risk', value: riskDistribution.high || 0, color: '#ef4444' },
    { name: 'Medium Risk', value: riskDistribution.medium || 0, color: '#f59e0b' },
    { name: 'Low Risk', value: riskDistribution.low || 0, color: '#10b981' }
  ].filter(item => item.value > 0);

  // Aggregate alert types
  const alertTypeCounts = fraudAlerts.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1;
    return acc;
  }, {});

  const alertBarData = Object.entries(alertTypeCounts).map(([type, count]) => ({
    type: type.replace('_', ' ').toUpperCase(),
    count
  }));

  // Top risk customers
  const topRiskCustomers = [...customers]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);

  // Get risk color for customer row
  const getRiskColor = (riskScore) => {
    if (riskScore >= 30) return '#ef4444';
    if (riskScore >= 15) return '#f59e0b';
    return '#10b981';
  };

  // Get status display
  const getStatusDisplay = (status) => {
    if (!status) return 'NORMAL';
    return status.replace('_', ' ').toUpperCase();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">LOADING REPORTS...</div>
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

      {/* Sidebar */}
      <div className="sidebar" style={{ width: sidebarOpen ? '260px' : '60px' }}>
        <div className="sidebar-header">
          {sidebarOpen && <h2 className="sidebar-title">FEDERAL 20!</h2>}
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? '<' : '>'}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            onClick={() => handleNavigate('dashboard', '/dashboard')} 
            className={`nav-item ${activePage === 'dashboard' ? 'nav-item-active' : ''}`}
          >
            {sidebarOpen ? 'DASHBOARD' : 'DB'}
          </button>
          
          <button 
            onClick={() => handleNavigate('customer', '/customer')} 
            className={`nav-item ${activePage === 'customer' ? 'nav-item-active' : ''}`}
          >
            {sidebarOpen ? 'CUSTOMERS' : 'CU'}
          </button>
          
          <button 
            onClick={() => handleNavigate('alerts', '/alerts')} 
            className={`nav-item ${activePage === 'alerts' ? 'nav-item-active' : ''}`}
          >
            {sidebarOpen ? 'ALERTS' : 'AL'}
          </button>
          
          <button 
            onClick={() => handleNavigate('network', '/network')} 
            className={`nav-item ${activePage === 'network' ? 'nav-item-active' : ''}`}
          >
            {sidebarOpen ? 'NETWORK' : 'NW'}
          </button>
          
          <button 
            onClick={() => handleNavigate('reports', '/reports')} 
            className={`nav-item ${activePage === 'reports' ? 'nav-item-active' : ''}`}
          >
            {sidebarOpen ? 'REPORTS' : 'RP'}
          </button>
        </nav>
        
        <button onClick={handleLogout} className="logout-nav-item">
          {sidebarOpen ? 'LOGOUT' : 'LO'}
        </button>
      </div>

      {/* Main Content */}
      <div className="main-wrapper" style={{ marginLeft: sidebarOpen ? '260px' : '60px' }}>
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <div className="header-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="header-title">FEDERAL 20! REPORTS</h1>
              <div className="status-bar">
                <span className="status-dot"></span>
                <span className="status-text">System status: OPERATIONAL</span>
                <span className="status-update">• Neo4j Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="export-buttons">
          <button className="export-btn" onClick={exportToCSV} disabled={exporting}>
            {exporting ? 'EXPORTING...' : 'EXPORT TO CSV'}
          </button>
          <button className="export-btn" onClick={printReport}>
            PRINT REPORT
          </button>
        </div>

        {/* Summary Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">TOTAL CUSTOMERS</div>
            <div className="stat-value">{stats.totalCustomers.toLocaleString()}</div>
            <div className="stat-trend">Active accounts</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">FLAGGED TRANSACTIONS</div>
            <div className="stat-value">{stats.flaggedTransactions}</div>
            <div className="stat-warning">Requires review</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">HIGH RISK CUSTOMERS</div>
            <div className="stat-value">{stats.highRiskCustomers}</div>
            <div className="stat-danger">Immediate attention</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">TOTAL FRAUD ALERTS</div>
            <div className="stat-value">{fraudAlerts.length}</div>
            <div className="stat-warning">Active investigations</div>
          </div>
        </div>

        {/* Reports Content */}
        <div className="main-content">
          {/* Left Column */}
          <div className="left-column">
            {/* Risk Distribution Pie Chart */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">RISK SCORE DISTRIBUTION</h3>
              </div>
              <div className="chart-container">
                {riskPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={riskPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {riskPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="no-data" style={{ textAlign: 'center', padding: '40px' }}>
                    No risk data available
                  </div>
                )}
              </div>
            </div>

            {/* Fraud Alert Types Bar Chart */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">FRAUD ALERT TYPES</h3>
              </div>
              <div className="chart-container">
                {alertBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={alertBarData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="type" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#11141d', borderColor: '#3b82f6', color: '#e2e8f0' }} />
                      <Bar dataKey="count" fill="#60a5fa" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="no-data" style={{ textAlign: 'center', padding: '40px' }}>
                    No alert data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="right-column">
            {/* Top High-Risk Customers */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">TOP HIGH-RISK CUSTOMERS</h3>
              </div>
              <div className="alerts-table">
                {topRiskCustomers.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer ID</th>
                        <th>Name</th>
                        <th>Risk Score</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topRiskCustomers.map((customer) => (
                        <tr key={customer.id}>
                          <td style={{ fontSize: '11px' }}>{customer.id}</td>
                          <td style={{ fontSize: '11px' }}>{customer.name}</td>
                          <td style={{ color: getRiskColor(customer.riskScore), fontSize: '11px', fontWeight: 'bold' }}>
                            {customer.riskScore}
                          </td>
                          <td style={{ fontSize: '11px' }}>{getStatusDisplay(customer.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-data">No customer data available</div>
                )}
              </div>
            </div>

            {/* Recent Fraud Alerts Summary */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">RECENT FRAUD ALERTS SUMMARY</h3>
              </div>
              <div className="alerts-summary">
                {fraudAlerts.length > 0 ? (
                  fraudAlerts.slice(0, 5).map((alert, index) => (
                    <div key={index} className="report-alert-item">
                      <div className="report-alert-type">
                        {alert.type ? alert.type.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                      </div>
                      <div className="report-alert-message">{alert.message || 'No message available'}</div>
                      <div className="report-alert-severity" style={{ 
                        color: alert.severity === 'CRITICAL' ? '#ef4444' : 
                               alert.severity === 'HIGH' ? '#f59e0b' : 
                               alert.severity === 'MEDIUM' ? '#3b82f6' : '#10b981' 
                      }}>
                        {alert.severity || 'UNKNOWN'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data" style={{ textAlign: 'center', padding: '20px' }}>
                    No fraud alerts available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;