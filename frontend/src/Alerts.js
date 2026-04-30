import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './App.css';

const Alerts = () => {
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
      if (error.response?.status === 401) {
        navigate('/login');
      }
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
      'HIGH': '#a855f7',
      'MEDIUM': '#3b82f6',
      'LOW': '#10b981'
    };
    return colors[severity] || '#3b82f6';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'FLAGGED_TRANSACTION': '[!]',
      'HIGH_RISK_CUSTOMER': '[X]',
      'CIRCULAR_TRANSACTION': '[◆]',
      'LARGE_TRANSACTION': '[$]',
      'UNUSUAL_PATTERN': '[~]'
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

  const getUniqueTypes = () => {
    const types = new Set(alerts.map(a => a.type));
    return Array.from(types);
  };

  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'CRITICAL').length,
    high: alerts.filter(a => a.severity === 'HIGH').length,
    medium: alerts.filter(a => a.severity === 'MEDIUM').length,
    reviewed: reviewedAlerts.size
  };

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
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </div>
            <div>
              <h1 className="header-title">FRAUD ALERT MANAGEMENT SYSTEM</h1>
              <div className="status-bar">
                <span className="status-dot"></span>
                <span className="status-text">Real-time threat detection active</span>
                <span className="status-update">• Monitoring enabled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ padding: '20px' }}>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '30px' }}>
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #1e293b',
              padding: '15px',
              borderRadius: '4px',
              borderLeft: '3px solid #3b82f6'
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '5px' }}>TOTAL ALERTS</div>
              <div style={{ fontSize: '20px', color: '#60a5fa', fontWeight: 'bold' }}>{stats.total}</div>
            </div>
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #1e293b',
              padding: '15px',
              borderRadius: '4px',
              borderLeft: '3px solid #ef4444'
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '5px' }}>CRITICAL</div>
              <div style={{ fontSize: '20px', color: '#ef4444', fontWeight: 'bold' }}>{stats.critical}</div>
            </div>
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #1e293b',
              padding: '15px',
              borderRadius: '4px',
              borderLeft: '3px solid #a855f7'
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '5px' }}>HIGH</div>
              <div style={{ fontSize: '20px', color: '#a855f7', fontWeight: 'bold' }}>{stats.high}</div>
            </div>
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #1e293b',
              padding: '15px',
              borderRadius: '4px',
              borderLeft: '3px solid #10b981'
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '5px' }}>REVIEWED</div>
              <div style={{ fontSize: '20px', color: '#10b981', fontWeight: 'bold' }}>{stats.reviewed}</div>
            </div>
          </div>

          {/* Controls Section */}
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid #1e293b',
            padding: '20px',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
              {/* Search Box */}
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '5px' }}>SEARCH</label>
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid #1e293b',
                    color: '#e2e8f0',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '12px',
                    borderRadius: '3px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#1e293b'}
                />
              </div>

              {/* Severity Filter */}
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '5px' }}>SEVERITY</label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid #1e293b',
                    color: '#e2e8f0',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '12px',
                    borderRadius: '3px',
                    outline: 'none'
                  }}
                >
                  <option value="ALL">All Levels</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '5px' }}>TYPE</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid #1e293b',
                    color: '#e2e8f0',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '12px',
                    borderRadius: '3px',
                    outline: 'none'
                  }}
                >
                  <option value="ALL">All Types</option>
                  {getUniqueTypes().map(type => (
                    <option key={type} value={type}>{getTypeLabel(type)}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '5px' }}>SORT BY</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid #1e293b',
                    color: '#e2e8f0',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '12px',
                    borderRadius: '3px',
                    outline: 'none'
                  }}
                >
                  <option value="LATEST">Latest First</option>
                  <option value="SEVERITY">By Severity</option>
                  <option value="AMOUNT">By Amount</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleRefresh}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid #3b82f6',
                  color: '#60a5fa',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '11px',
                  cursor: 'pointer',
                  borderRadius: '3px',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.3)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'}
              >
                REFRESH
              </button>
              <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                Showing {filteredAlerts.length} of {alerts.length} alerts
              </div>
            </div>
          </div>

          {/* Alerts List */}
          {loading ? (
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #1e293b',
              padding: '40px',
              borderRadius: '4px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <div style={{ fontSize: '16px', letterSpacing: '0.1em' }}>▌ SCANNING NETWORK FOR FRAUDULENT PATTERNS...</div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #1e293b',
              padding: '40px',
              borderRadius: '4px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>✓ No Threats Detected</div>
              <div style={{ fontSize: '12px' }}>No alerts match your current filter criteria</div>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: `1px solid ${getSeverityColor(alert.severity)}`,
                  borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
                  padding: '15px',
                  marginBottom: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  opacity: reviewedAlerts.has(alert.id) ? 0.6 : 1
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.8)'}
              >
                {/* Alert Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', flex: 1 }}>
                    <div style={{ fontSize: '24px' }}>{getTypeIcon(alert.type)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', color: getSeverityColor(alert.severity), fontWeight: 'bold', letterSpacing: '0.05em' }}>
                          [{alert.severity}]
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{getTypeLabel(alert.type)}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '5px' }}>
                        {alert.message}
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569' }}>
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <button
                      onClick={(e) => toggleReviewed(alert.id, e)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: reviewedAlerts.has(alert.id) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                        border: `1px solid ${reviewedAlerts.has(alert.id) ? '#10b981' : '#475569'}`,
                        color: reviewedAlerts.has(alert.id) ? '#10b981' : '#94a3b8',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '10px',
                        cursor: 'pointer',
                        borderRadius: '2px',
                        transition: 'all 0.2s',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {reviewedAlerts.has(alert.id) ? '✓ REVIEWED' : 'MARK'}
                    </button>
                  </div>
                </div>

                {/* Details Section */}
                {expandedAlert === alert.id && (
                  <div style={{
                    marginTop: '15px',
                    paddingTop: '15px',
                    borderTop: '1px solid rgba(100, 116, 139, 0.3)',
                    fontSize: '11px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                      {alert.customer && (
                        <div>
                          <div style={{ color: '#64748b', marginBottom: '4px' }}>CUSTOMER</div>
                          <div style={{ color: '#60a5fa' }}>{alert.customer}</div>
                        </div>
                      )}
                      {alert.customers && (
                        <div>
                          <div style={{ color: '#64748b', marginBottom: '4px' }}>PARTIES INVOLVED</div>
                          <div style={{ color: '#60a5fa' }}>{alert.customers.join(' ↔ ')}</div>
                        </div>
                      )}
                      {alert.amount && (
                        <div>
                          <div style={{ color: '#64748b', marginBottom: '4px' }}>AMOUNT</div>
                          <div style={{ color: '#10b981' }}>${alert.amount.toFixed(2)}</div>
                        </div>
                      )}
                      {alert.riskScore && (
                        <div>
                          <div style={{ color: '#64748b', marginBottom: '4px' }}>RISK SCORE</div>
                          <div style={{ color: '#ef4444' }}>{alert.riskScore}</div>
                        </div>
                      )}
                      {alert.amounts && (
                        <div>
                          <div style={{ color: '#64748b', marginBottom: '4px' }}>TRANSACTION AMOUNTS</div>
                          <div style={{ color: '#10b981' }}>
                            ${alert.amounts[0].toFixed(2)} → ${alert.amounts[1].toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Panel */}
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      <button style={{
                        padding: '6px 12px',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid #3b82f6',
                        color: '#60a5fa',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '10px',
                        cursor: 'pointer',
                        borderRadius: '2px',
                        letterSpacing: '0.05em'
                      }}>
                        INVESTIGATE
                      </button>
                      <button style={{
                        padding: '6px 12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '10px',
                        cursor: 'pointer',
                        borderRadius: '2px',
                        letterSpacing: '0.05em'
                      }}>
                        ESCALATE
                      </button>
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

export default Alerts;
