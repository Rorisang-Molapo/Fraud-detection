import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './App.css';

const FraudAlerts = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('alerts');
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('LATEST');
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [reviewedAlerts, setReviewedAlerts] = useState(new Set());

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    filterAndSortAlerts();
  }, [alerts, selectedSeverity, selectedType, searchTerm, sortBy, reviewedAlerts]);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/fraud-alerts', {
        withCredentials: true
      });
      setAlerts(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching fraud alerts:', error);
      setLoading(false);
    }
  };

  const filterAndSortAlerts = () => {
    let filtered = alerts.filter(alert => {
      const matchesSeverity = selectedSeverity === 'ALL' || alert.severity === selectedSeverity;
      const matchesType = selectedType === 'ALL' || alert.type === selectedType;
      const matchesSearch = searchTerm === '' || 
        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (alert.customer && alert.customer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (alert.customers && alert.customers.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())));
      
      return matchesSeverity && matchesType && matchesSearch;
    });

    if (sortBy === 'LATEST') {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortBy === 'SEVERITY') {
      const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      filtered.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    } else if (sortBy === 'AMOUNT') {
      filtered.sort((a, b) => (b.amount || 0) - (a.amount || 0));
    }

    setFilteredAlerts(filtered);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'CRITICAL': '#ef4444',
      'HIGH': '#f59e0b',
      'MEDIUM': '#3b82f6',
      'LOW': '#10b981'
    };
    return colors[severity] || '#3b82f6';
  };

  const getTypeIcon = (type) => {
    const icons = {
      
    };
    return icons[type] || '[•]';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'FLAGGED_TRANSACTION': 'Flagged Transaction',
      'HIGH_RISK_CUSTOMER': 'High Risk Customer',
      'CIRCULAR_TRANSACTION': 'Circular Transaction',
      'LARGE_TRANSACTION': 'Large Transaction',
      'UNUSUAL_PATTERN': 'Unusual Pattern'
    };
    return labels[type] || type;
  };

  const toggleReviewed = (alertId, e) => {
    e.stopPropagation();
    const newReviewed = new Set(reviewedAlerts);
    if (newReviewed.has(alertId)) {
      newReviewed.delete(alertId);
    } else {
      newReviewed.add(alertId);
    }
    setReviewedAlerts(newReviewed);
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchAlerts();
  };

  const getUniqueTypes = () => {
    const types = new Set(alerts.map(a => a.type));
    return Array.from(types);
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

  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'CRITICAL').length,
    high: alerts.filter(a => a.severity === 'HIGH').length,
    medium: alerts.filter(a => a.severity === 'MEDIUM').length,
    reviewed: reviewedAlerts.size
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Please be patient while we load the alerts...</div>
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h1 className="header-title">FEDERAL 20! FRAUD ALERTS</h1>
              <div className="status-bar">
                <span className="status-dot"></span>
                <span className="status-text">System status: OPERATIONAL</span>
                <span className="status-update">• Real-time monitoring active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="alerts-stats-grid">
          <div className="alert-stat-card critical-border">
            <div className="alert-stat-label">TOTAL ALERTS</div>
            <div className="alert-stat-value primary">{stats.total}</div>
          </div>
          <div className="alert-stat-card critical-border">
            <div className="alert-stat-label">CRITICAL</div>
            <div className="alert-stat-value critical">{stats.critical}</div>
          </div>
          <div className="alert-stat-card high-border">
            <div className="alert-stat-label">HIGH</div>
            <div className="alert-stat-value high">{stats.high}</div>
          </div>
          <div className="alert-stat-card success-border">
            <div className="alert-stat-label">REVIEWED</div>
            <div className="alert-stat-value success">{stats.reviewed}</div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="alerts-controls">
          <div className="alerts-filters">
            <div className="filter-group">
              <label className="filter-label">SEARCH</label>
              <input
                type="text"
                className="filter-input"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">SEVERITY</label>
              <select
                className="filter-select"
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
              >
                <option value="ALL">All Levels</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">TYPE</label>
              <select
                className="filter-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="ALL">All Types</option>
                {getUniqueTypes().map(type => (
                  <option key={type} value={type}>{getTypeLabel(type)}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">SORT BY</label>
              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="LATEST">Latest First</option>
                <option value="SEVERITY">By Severity</option>
                <option value="AMOUNT">By Amount</option>
              </select>
            </div>
          </div>

          <div className="alerts-actions">
            <button className="refresh-button" onClick={handleRefresh}>
              REFRESH
            </button>
            <div className="alerts-count">
              Showing {filteredAlerts.length} of {alerts.length} alerts
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="alerts-list">
          {filteredAlerts.length === 0 ? (
            <div className="no-alerts">
              <div className="no-alerts-icon">✓</div>
              <div>No Threats Detected</div>
              <div className="no-alerts-sub">No alerts match your current filter criteria</div>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`alert-item ${reviewedAlerts.has(alert.id) ? 'alert-reviewed' : ''}`}
                style={{ borderLeftColor: getSeverityColor(alert.severity) }}
                onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
              >
                <div className="alert-header">
                  <div className="alert-info">
                    <div className="alert-icon">{getTypeIcon(alert.type)}</div>
                    <div className="alert-details">
                      <div className="alert-badges">
                        <span className={`alert-severity severity-${alert.severity.toLowerCase()}`}>
                          [{alert.severity}]
                        </span>
                        <span className="alert-type">{getTypeLabel(alert.type)}</span>
                      </div>
                      <div className="alert-message">{alert.message}</div>
                      <div className="alert-timestamp">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <button
                    className={`mark-button ${reviewedAlerts.has(alert.id) ? 'marked' : ''}`}
                    onClick={(e) => toggleReviewed(alert.id, e)}
                  >
                    {reviewedAlerts.has(alert.id) ? 'REVIEWED' : 'MARK'}
                  </button>
                </div>

                {expandedAlert === alert.id && (
                  <div className="alert-expanded">
                    <div className="alert-details-grid">
                      {alert.customer && (
                        <div className="detail-item">
                          <div className="detail-label">CUSTOMER</div>
                          <div className="detail-value customer">{alert.customer}</div>
                        </div>
                      )}
                      {alert.customers && (
                        <div className="detail-item">
                          <div className="detail-label">PARTIES INVOLVED</div>
                          <div className="detail-value customer">{alert.customers.join(' ↔ ')}</div>
                        </div>
                      )}
                      {alert.amount && (
                        <div className="detail-item">
                          <div className="detail-label">AMOUNT</div>
                          <div className="detail-value amount">${alert.amount.toFixed(2)}</div>
                        </div>
                      )}
                      {alert.riskScore && (
                        <div className="detail-item">
                          <div className="detail-label">RISK SCORE</div>
                          <div className="detail-value risk">{alert.riskScore}</div>
                        </div>
                      )}
                      {alert.amounts && (
                        <div className="detail-item">
                          <div className="detail-label">TRANSACTION AMOUNTS</div>
                          <div className="detail-value amount">
                            ${alert.amounts[0].toFixed(2)} → ${alert.amounts[1].toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="alert-actions">
                      <button className="investigate-action">INVESTIGATE</button>
                      <button className="escalate-action">ESCALATE</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FraudAlerts;