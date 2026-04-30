import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './App.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalTransactions: 0,
    flaggedTransactions: 0,
    highRiskCustomers: 0,
    totalTransferAmount: 0,
    avgRiskScore: 0
  });
  const [highRiskAlerts, setHighRiskAlerts] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState({
    high: 0,
    medium: 0,
    low: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, alertsRes, riskRes] = await Promise.all([
        axios.get('http://localhost:5000/api/dashboard/stats', { withCredentials: true }),
        axios.get('http://localhost:5000/api/dashboard/high-risk-alerts', { withCredentials: true }),
        axios.get('http://localhost:5000/api/dashboard/risk-distribution', { withCredentials: true })
      ]);

      setStats(statsRes.data);
      setHighRiskAlerts(alertsRes.data);
      setRiskDistribution(riskRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const getRiskColor = (riskScore) => {
    if (riskScore >= 70) return '#ef4444';
    if (riskScore >= 40) return '#f59e0b';
    return '#10b981';
  };

  const getRiskLevel = (riskScore) => {
    if (riskScore >= 70) return 'CRITICAL';
    if (riskScore >= 40) return 'ELEVATED';
    return 'MODERATE';
  };

  const getRiskClass = (riskScore) => {
    if (riskScore >= 70) return 'risk-critical';
    if (riskScore >= 40) return 'risk-elevated';
    return 'risk-moderate';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">LOADING SECURE TERMINAL...</div>
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
            onClick={() => handleNavigate('network', 'network')} 
            className={`nav-item ${activePage === 'network' ? 'nav-item-active' : ''}`}
          >
            {sidebarOpen ? 'NETWORK' : 'NW'}
          </button>
          
          <button 
            onClick={() => handleNavigate('reports', 'reports')} 
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h1 className="header-title">FEDERAL 20! DASHBOARD</h1>
              <div className="status-bar">
                <span className="status-dot"></span>
                <span className="status-text">System status: OPERATIONAL</span>
                <span className="status-update">• Neo4j Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">TOTAL CUSTOMERS</div>
            <div className="stat-value">{stats.totalCustomers.toLocaleString()}</div>
            <div className="stat-trend">Active accounts</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">FLAGGED FOR REVIEW</div>
            <div className="stat-value">{stats.flaggedTransactions}</div>
            <div className="stat-warning">Requires analyst action</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">HIGH RISK CUSTOMERS</div>
            <div className="stat-value">{stats.highRiskCustomers}</div>
            <div className="stat-danger">Immediate attention needed</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">ACTIVE THREATS</div>
            <div className="stat-value">{stats.highRiskCustomers}</div>
            <div className="stat-danger">High-risk concurrent vectors</div>
          </div>
        </div>

        {/* Second Row Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">TOTAL TRANSACTIONS</div>
            <div className="stat-value">{stats.totalTransactions.toLocaleString()}</div>
            <div className="stat-trend">All time</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">TOTAL TRANSFER VOLUME</div>
            <div className="stat-value">${stats.totalTransferAmount.toLocaleString()}</div>
            <div className="stat-trend">Inter-account transfers</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">MEAN SYSTEM RISK SCORE</div>
            <div className="stat-value">{stats.avgRiskScore}</div>
            <div className="stat-trend">Weighted average</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">GEO-IP CONTEXT</div>
            <div className="stat-value">ACTIVE</div>
            <div className="stat-trend">Monitoring active</div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="main-content">
          {/* Left Column - Risk Distribution */}
          <div className="left-column">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">RISK SCORE DISTRIBUTION</h3>
              </div>
              <div className="risk-distribution">
                <div className="risk-item">
                  <div className="risk-label">
                    <span className="risk-color-critical"></span>
                    <span>CRITICAL (70-100)</span>
                  </div>
                  <div className="risk-bar">
                    <div className="risk-fill" style={{ width: `${(riskDistribution.high / (riskDistribution.high + riskDistribution.medium + riskDistribution.low)) * 100 || 0}%`, backgroundColor: '#ef4444' }}></div>
                  </div>
                  <span className="risk-percent">{riskDistribution.high}</span>
                </div>
                <div className="risk-item">
                  <div className="risk-label">
                    <span className="risk-color-elevated"></span>
                    <span>ELEVATED (40-69)</span>
                  </div>
                  <div className="risk-bar">
                    <div className="risk-fill" style={{ width: `${(riskDistribution.medium / (riskDistribution.high + riskDistribution.medium + riskDistribution.low)) * 100 || 0}%`, backgroundColor: '#f59e0b' }}></div>
                  </div>
                  <span className="risk-percent">{riskDistribution.medium}</span>
                </div>
                <div className="risk-item">
                  <div className="risk-label">
                    <span className="risk-color-moderate"></span>
                    <span>MODERATE (0-39)</span>
                  </div>
                  <div className="risk-bar">
                    <div className="risk-fill" style={{ width: `${(riskDistribution.low / (riskDistribution.high + riskDistribution.medium + riskDistribution.low)) * 100 || 0}%`, backgroundColor: '#10b981' }}></div>
                  </div>
                  <span className="risk-percent">{riskDistribution.low}</span>
                </div>
              </div>
              <div className="risk-total">
                <span>Total Customers: {stats.totalCustomers}</span>
                <span>Mean Risk Score: {stats.avgRiskScore}</span>
              </div>
            </div>
          </div>

          {/* Right Column - Recent High Risk Alerts */}
          <div className="right-column">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">RECENT HIGH-RISK ALERTS</h3>
                <span className="card-link">View all alerts →</span>
              </div>
              <div className="alerts-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer ID</th>
                      <th>Risk Level</th>
                      <th>Risk Score</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highRiskAlerts.length > 0 ? (
                      highRiskAlerts.map((alert, index) => (
                        <tr key={index}>
                          <td>{alert.id}</td>
                          <td style={{ color: getRiskColor(alert.riskScore), fontWeight: 'bold' }}>
                            {getRiskLevel(alert.riskScore)}
                          </td>
                          <td>{alert.riskScore}</td>
                          <td>
                            <button className="investigate-button">INVESTIGATE</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="no-data">No high-risk alerts</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;