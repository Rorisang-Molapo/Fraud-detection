import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './App.css';

const Network = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('network');
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/network/data', {
        withCredentials: true
      });
      setGraphData(response.data || { nodes: [], edges: [] });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching network data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        // Set empty data but still show the page
        setGraphData({ nodes: [], edges: [] });
      }
      setLoading(false);
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

  const getNodeColor = (type, isFlagged, riskScore) => {
    switch(type) {
      case 'Customer':
        if (riskScore >= 70) return '#ef4444';
        if (riskScore >= 40) return '#f59e0b';
        return '#60a5fa';
      case 'Account':
        if (isFlagged) return '#ef4444';
        return '#10b981';
      case 'Transaction':
        return '#a78bfa';
      case 'Device':
        return '#f97316';
      case 'IPAddress':
        return '#06b6d4';
      case 'Location':
        return '#ec489a';
      default:
        return '#64748b';
    }
  };

  const getNodeSize = (type, amount, riskScore) => {
    if (type === 'Transaction' && amount) {
      return Math.min(20 + (amount / 1000), 35);
    }
    if (type === 'Customer' && riskScore) {
      return 20 + (riskScore / 20);
    }
    if (type === 'Account') return 18;
    return 15;
  };

  const filteredNodes = graphData.nodes.filter(node => {
    if (filter === 'ALL') return true;
    if (filter === 'SUSPICIOUS') {
      return node.isFlagged || (node.riskScore && node.riskScore >= 50);
    }
    return node.type === filter;
  });

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = graphData.edges.filter(edge => 
    filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">LOADING NETWORK VISUALIZATION...</div>
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
            onClick={() => handleNavigate('reports', null)} 
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
              <h1 className="header-title">FEDERAL 20! NETWORK ANALYSIS</h1>
              <div className="status-bar">
                <span className="status-dot"></span>
                <span className="status-text">System status: OPERATIONAL</span>
                <span className="status-update">• Graph Database Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Network Controls */}
        <div className="network-controls">
          <div className="filter-section">
            <label className="filter-label">FILTER BY:</label>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilter('ALL')}
              >
                ALL
              </button>
              <button 
                className={`filter-btn ${filter === 'Customer' ? 'active' : ''}`}
                onClick={() => setFilter('Customer')}
              >
                CUSTOMERS
              </button>
              <button 
                className={`filter-btn ${filter === 'Account' ? 'active' : ''}`}
                onClick={() => setFilter('Account')}
              >
                ACCOUNTS
              </button>
              <button 
                className={`filter-btn ${filter === 'Transaction' ? 'active' : ''}`}
                onClick={() => setFilter('Transaction')}
              >
                TRANSACTIONS
              </button>
              <button 
                className={`filter-btn ${filter === 'Device' ? 'active' : ''}`}
                onClick={() => setFilter('Device')}
              >
                DEVICES
              </button>
              <button 
                className={`filter-btn ${filter === 'SUSPICIOUS' ? 'active' : ''}`}
                onClick={() => setFilter('SUSPICIOUS')}
              >
                SUSPICIOUS ONLY
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="network-legend">
          <div className="legend-title">LEGEND</div>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#60a5fa' }}></div>
              <span>Customer (Low Risk)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
              <span>Customer (Medium Risk)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div>
              <span>Customer (High Risk) / Flagged Account</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
              <span>Account (Normal)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#a78bfa' }}></div>
              <span>Transaction</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#f97316' }}></div>
              <span>Device</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#06b6d4' }}></div>
              <span>IP Address</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ec489a' }}></div>
              <span>Location</span>
            </div>
          </div>
        </div>

        {/* Network Graph Placeholder */}
        <div className="network-graph-container">
          <div className="graph-placeholder">
            <div className="graph-placeholder-icon">[NETWORK GRAPH VISUALIZATION]</div>
            <div className="graph-placeholder-text">
              Interactive graph showing:
            </div>
            <div className="graph-placeholder-list">
              <div>• {graphData.nodes.length} nodes found in database</div>
              <div>• {graphData.edges.length} relationships mapped</div>
              <div>• {graphData.nodes.filter(n => n.isFlagged).length} flagged entities detected</div>
              <div>• {graphData.nodes.filter(n => n.riskScore && n.riskScore >= 70).length} high-risk customers</div>
            </div>
            <div className="graph-placeholder-note">
              [Graph visualization will display here with draggable nodes, zoom, and click interactions]
            </div>
          </div>
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="selected-node-panel">
            <div className="selected-node-header">
              <h3>NODE DETAILS</h3>
              <button className="close-panel" onClick={() => setSelectedNode(null)}>X</button>
            </div>
            <div className="selected-node-content">
              <div className="node-detail-row">
                <span className="node-detail-label">Type:</span>
                <span className="node-detail-value">{selectedNode.type}</span>
              </div>
              <div className="node-detail-row">
                <span className="node-detail-label">ID/Label:</span>
                <span className="node-detail-value">{selectedNode.label}</span>
              </div>
              {selectedNode.riskScore !== undefined && (
                <div className="node-detail-row">
                  <span className="node-detail-label">Risk Score:</span>
                  <span className={`node-detail-value ${selectedNode.riskScore >= 70 ? 'risk-critical' : selectedNode.riskScore >= 40 ? 'risk-high' : 'risk-normal'}`}>
                    {selectedNode.riskScore}
                  </span>
                </div>
              )}
              {selectedNode.amount !== undefined && (
                <div className="node-detail-row">
                  <span className="node-detail-label">Amount:</span>
                  <span className="node-detail-value">${selectedNode.amount.toFixed(2)}</span>
                </div>
              )}
              {selectedNode.isFlagged && (
                <div className="node-detail-row">
                  <span className="node-detail-label">Status:</span>
                  <span className="node-detail-value status-flagged">FLAGGED</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Network;