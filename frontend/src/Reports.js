import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import './App.css';

const Reports = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('reports');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    riskDistribution: { high: { count: 0, avgScore: 0 }, medium: { count: 0, avgScore: 0 }, low: { count: 0, avgScore: 0 }, totalThreats: 0, overallAvg: 0 },
    moneyMules: [],
    impossibleTravel: [],
    vpnAnalysis: { totalVolume: 0, topService: '', topSessions: 0, torNodes: 0, criticalLevel: 0 },
    proxyEndpoints: []
  });
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const fetchReportData = async () => {
    try {
      const [riskRes, muleRes, travelRes, vpnRes, proxyRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/reports/risk-distribution?range=${timeRange}`, { withCredentials: true }),
        axios.get(`http://localhost:5000/api/reports/money-mules?range=${timeRange}`, { withCredentials: true }),
        axios.get(`http://localhost:5000/api/reports/impossible-travel?range=${timeRange}`, { withCredentials: true }),
        axios.get(`http://localhost:5000/api/reports/vpn-analysis?range=${timeRange}`, { withCredentials: true }),
        axios.get(`http://localhost:5000/api/reports/proxy-endpoints?range=${timeRange}`, { withCredentials: true })
      ]);

      setReportData({
        riskDistribution: riskRes.data,
        moneyMules: muleRes.data,
        impossibleTravel: travelRes.data,
        vpnAnalysis: vpnRes.data,
        proxyEndpoints: proxyRes.data
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/logout', {}, { withCredentials: true });
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavigate = (page, path) => {
    setActivePage(page);
    if (path) {
      setTimeout(() => navigate(path), 150);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const exportToCSV = () => {
    const csvContent = [
      ['REPORT', ''],
      ['Generated:', new Date().toLocaleString()],
      ['', ''],
      ['RISK DISTRIBUTION', ''],
      ['Level', 'Count', 'Average Score'],
      ['High', reportData.riskDistribution.high.count, reportData.riskDistribution.high.avgScore],
      ['Medium', reportData.riskDistribution.medium.count, reportData.riskDistribution.medium.avgScore],
      ['Low', reportData.riskDistribution.low.count, reportData.riskDistribution.low.avgScore],
      ['Total Threats:', reportData.riskDistribution.totalThreats, ''],
      ['', ''],
      ['MONEY MULE DETECTION', ''],
      ['Entity ID', 'Velocity (in/out)', 'Aggregate Vol', 'Risk Score'],
      ...reportData.moneyMules.map(m => [m.entityId, m.velocity, `$${m.aggregateVol.toFixed(2)}`, m.riskScore]),
      ['', ''],
      ['VPN/PROXY ANALYSIS', ''],
      ['Anonymized Traffic Volume:', `${reportData.vpnAnalysis.totalVolume}%`, ''],
      ['Top Service:', reportData.vpnAnalysis.topService, `${reportData.vpnAnalysis.topSessions} Sessions`],
      ['TOR Nodes:', reportData.vpnAnalysis.torNodes, `Critical Level: ${reportData.vpnAnalysis.criticalLevel}`],
      ['', ''],
      ['SUSPICIOUS PROXY ENDPOINTS', ''],
      ...reportData.proxyEndpoints.map(p => [p.address, p.description])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `federal20_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printReport = () => window.print();

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

      {/* Sidebar */}
      <div className="sidebar" style={{ width: sidebarOpen ? '260px' : '60px' }}>
        <div className="sidebar-header">
          {sidebarOpen && <h2 className="sidebar-title">FEDERAL 20!</h2>}
          <button className="sidebar-toggle" onClick={toggleSidebar}>{sidebarOpen ? '<' : '>'}</button>
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => handleNavigate('dashboard', '/dashboard')} className={`nav-item ${activePage === 'dashboard' ? 'nav-item-active' : ''}`}>
            {sidebarOpen ? 'DASHBOARD' : 'DB'}
          </button>
          <button onClick={() => handleNavigate('customer', '/customer')} className={`nav-item ${activePage === 'customer' ? 'nav-item-active' : ''}`}>
            {sidebarOpen ? 'CUSTOMERS' : 'CU'}
          </button>
          <button onClick={() => handleNavigate('alerts', '/alerts')} className={`nav-item ${activePage === 'alerts' ? 'nav-item-active' : ''}`}>
            {sidebarOpen ? 'ALERTS' : 'AL'}
          </button>
          <button onClick={() => handleNavigate('network', '/network')} className={`nav-item ${activePage === 'network' ? 'nav-item-active' : ''}`}>
            {sidebarOpen ? 'NETWORK' : 'NW'}
          </button>
          <button onClick={() => handleNavigate('reports', '/reports')} className={`nav-item ${activePage === 'reports' ? 'nav-item-active' : ''}`}>
            {sidebarOpen ? 'REPORTS' : 'RP'}
          </button>
        </nav>
        <button onClick={handleLogout} className="logout-nav-item">{sidebarOpen ? 'LOGOUT' : 'LO'}</button>
      </div>

      {/* Main Content */}
      <div className="main-wrapper" style={{ marginLeft: sidebarOpen ? '260px' : '60px' }}>
        {/* Header */}
        <div className="reports-header">
          <div className="reports-header-left">
            <div className="reports-header-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="reports-header-title">FRAUD REPORTS</h1>
              <p className="reports-header-subtitle">Aggregate risk analysis for the last {timeRange === '24h' ? '24-hour' : timeRange === '7d' ? '7-day' : '30-day'} cycle.</p>
            </div>
          </div>
          <div className="reports-header-right">
            <div className="time-range-selector">
              <button className={`time-btn ${timeRange === '24h' ? 'active' : ''}`} onClick={() => setTimeRange('24h')}>24H</button>
              <button className={`time-btn ${timeRange === '7d' ? 'active' : ''}`} onClick={() => setTimeRange('7d')}>7D</button>
              <button className={`time-btn ${timeRange === '30d' ? 'active' : ''}`} onClick={() => setTimeRange('30d')}>30D</button>
            </div>
            <div className="export-buttons">
              <button className="export-csv-btn" onClick={exportToCSV}>📄 EXPORT CSV</button>
              <button className="export-print-btn" onClick={printReport}>🖨️ PRINT</button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="reports-stats-row">
          <div className="reports-stat-card">
            <div className="reports-stat-label">TOTAL THREATS</div>
            <div className="reports-stat-value">{reportData.riskDistribution.totalThreats.toLocaleString()}</div>
            <div className="reports-stat-trend">+12% VS PREV WEEK</div>
          </div>
          <div className="reports-stat-card">
            <div className="reports-stat-label">MEAN RISK SCORE</div>
            <div className="reports-stat-value">{reportData.riskDistribution.overallAvg}</div>
            <div className="reports-stat-trend">-3% VS PREV WEEK</div>
          </div>
          <div className="reports-stat-card">
            <div className="reports-stat-label">ANONYMIZED TRAFFIC</div>
            <div className="reports-stat-value">{reportData.vpnAnalysis.totalVolume}%</div>
            <div className="reports-stat-trend">+5% VS PREV WEEK</div>
          </div>
          <div className="reports-stat-card">
            <div className="reports-stat-label">CRITICAL ALERTS</div>
            <div className="reports-stat-value">{reportData.riskDistribution.high.count}</div>
            <div className="reports-stat-trend">+8% VS PREV WEEK</div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="reports-two-column">
          {/* Left Column */}
          <div className="reports-left-column">
            {/* Risk Distribution Card */}
            <div className="reports-card risk-card">
              <div className="reports-card-header">
                <h3>RISK DISTRIBUTION</h3>
                <span className="reports-card-badge">LIVE</span>
              </div>
              <div className="risk-table-container">
                <table className="risk-table">
                  <thead>
                    <tr><th>LEVEL</th><th>COUNT</th><th>AVG SCORE</th></tr>
                  </thead>
                  <tbody>
                    <tr><td className="risk-high">HIGH</td><td>{reportData.riskDistribution.high.count.toLocaleString()}</td><td>{reportData.riskDistribution.high.avgScore}</td></tr>
                    <tr><td className="risk-medium">MEDIUM</td><td>{reportData.riskDistribution.medium.count.toLocaleString()}</td><td>{reportData.riskDistribution.medium.avgScore}</td></tr>
                    <tr><td className="risk-low">LOW</td><td>{reportData.riskDistribution.low.count.toLocaleString()}</td><td>{reportData.riskDistribution.low.avgScore}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="risk-chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={[
                      { name: 'High', value: reportData.riskDistribution.high.count, color: '#ef4444' },
                      { name: 'Medium', value: reportData.riskDistribution.medium.count, color: '#f59e0b' },
                      { name: 'Low', value: reportData.riskDistribution.low.count, color: '#10b981' }
                    ]} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                      {[{ color: '#ef4444' }, { color: '#f59e0b' }, { color: '#10b981' }].map((entry, idx) => (<Cell key={`cell-${idx}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#11141d', borderColor: '#3b82f6' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Money Mule Detection Card */}
            <div className="reports-card mule-card">
              <div className="reports-card-header">
                <h3>MONEY MULE DETECTION</h3>
                <span className="reports-card-alert">⚠️ ACTIVE</span>
              </div>
              <div className="mule-table-container">
                <table className="mule-table">
                  <thead>
                    <tr><th>ENTITY ID</th><th>VELOCITY (IN/OUT)</th><th>AGGREGATE VOL</th><th>RISK SCORE</th></tr>
                  </thead>
                  <tbody>
                    {reportData.moneyMules.length > 0 ? reportData.moneyMules.map((mule, idx) => (
                      <tr key={idx}>
                        <td className="entity-id">{mule.entityId}</td>
                        <td>{mule.velocity}</td>
                        <td>${mule.aggregateVol.toLocaleString()}</td>
                        <td className={`risk-score-${mule.riskScore >= 90 ? 'critical' : mule.riskScore >= 70 ? 'high' : 'medium'}`}>{mule.riskScore}</td>
                      </tr>
                    )) : <tr><td colSpan="4" className="no-data">No money mules detected</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Suspicious Proxy Endpoints Card */}
            <div className="reports-card proxy-card">
              <div className="reports-card-header">
                <h3>SUSPICIOUS PROXY ENDPOINTS</h3>
                <span className="reports-card-badge">BLOCKLIST</span>
              </div>
              <div className="proxy-list">
                {reportData.proxyEndpoints.length > 0 ? reportData.proxyEndpoints.map((proxy, idx) => (
                  <div key={idx} className="proxy-item">
                    <div className="proxy-ip">{proxy.address}</div>
                    <div className="proxy-desc">{proxy.description}</div>
                  </div>
                )) : <div className="no-data">No suspicious proxy endpoints detected</div>}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="reports-right-column">
            {/* Impossible Travel Alerts Card */}
            <div className="reports-card travel-card">
              <div className="reports-card-header">
                <h3>IMPOSSIBLE TRAVEL ALERTS</h3>
                <span className="reports-card-critical">🚨 CRITICAL</span>
              </div>
              <div className="travel-grid">
                {reportData.impossibleTravel.length > 0 ? reportData.impossibleTravel.map((travel, idx) => (
                  <div key={idx} className="travel-item">
                    <div className="travel-header">
                      <span className="travel-id">{travel.id}</span>
                      <button className="investigate-link">INVESTIGATE →</button>
                    </div>
                    <div className="travel-locations">
                      <div className="travel-from">
                        <span className="travel-city">{travel.fromLocation}</span>
                        <span className="travel-time">{travel.fromTime}</span>
                      </div>
                      <div className="travel-arrow">→</div>
                      <div className="travel-to">
                        <span className="travel-city">{travel.toLocation}</span>
                        <span className="travel-time">{travel.toTime}</span>
                      </div>
                    </div>
                    <div className="travel-velocity">Velocity: {travel.velocity}km/h</div>
                    <div className="travel-risk">Risk Level: {travel.riskLevel}</div>
                  </div>
                )) : <div className="no-data">No impossible travel alerts detected</div>}
              </div>
            </div>

            {/* VPN/Proxy Analysis Card */}
            <div className="reports-card vpn-card">
              <div className="reports-card-header">
                <h3>VPN / PROXY ANALYSIS</h3>
                <span className="reports-card-badge">ANONYMIZED</span>
              </div>
              <div className="vpn-stats">
                <div className="vpn-volume">
                  <div className="vpn-volume-label">ANONYMIZED TRAFFIC VOLUME</div>
                  <div className="vpn-volume-value">{reportData.vpnAnalysis.totalVolume}%</div>
                  <div className="vpn-volume-bar">
                    <div className="vpn-volume-fill" style={{ width: `${reportData.vpnAnalysis.totalVolume}%` }}></div>
                  </div>
                </div>
                <div className="vpn-top-service">
                  <div className="vpn-service-label">TOP SERVICE</div>
                  <div className="vpn-service-name">{reportData.vpnAnalysis.topService}</div>
                  <div className="vpn-service-sessions">{reportData.vpnAnalysis.topSessions} Sessions</div>
                </div>
                <div className="vpn-tor">
                  <div className="vpn-tor-label">TOR NODES</div>
                  <div className="vpn-tor-value">{reportData.vpnAnalysis.torNodes}</div>
                  <div className="vpn-tor-critical">CRITICAL LEVEL: {reportData.vpnAnalysis.criticalLevel}</div>
                </div>
              </div>
            </div>

            {/* Support Footer */}
            <div className="reports-support">
              <span>Support</span>
              <span className="support-separator">|</span>
              <span>Logout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;