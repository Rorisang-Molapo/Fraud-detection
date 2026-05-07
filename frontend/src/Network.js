import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Network as VisNetwork } from 'vis-network';
import './App.css';

const Network = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('network');
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [maxTransactions, setMaxTransactions] = useState(50);
  const [maxTransferEdges, setMaxTransferEdges] = useState(100);
  const containerRef = useRef(null);
  const networkInstanceRef = useRef(null);

  useEffect(() => {
    fetchNetworkData();
  }, []);

  useEffect(() => {
    if (!loading && graphData.nodes.length > 0) {
      drawGraph();
    }
  }, [loading, graphData, filter, maxTransactions, maxTransferEdges]);

  const cleanId = (id) => {
    if (id === null || id === undefined) return null;
    if (typeof id === 'object' && id.low !== undefined) return id.low;
    if (typeof id === 'object' && id.toString) return id.toString();
    return id;
  };

  const fetchNetworkData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/network/data', {
        withCredentials: true
      });
      
      if (response.data && response.data.nodes && response.data.edges) {
        let limitedData = limitGraphData(response.data, maxTransactions, maxTransferEdges);
        
        // Ensure every node has a string id
        limitedData.nodes = limitedData.nodes
          .filter(n => n.id != null && n.id !== '')
          .map(node => ({
            ...node,
            id: String(cleanId(node.id))
          }));
        
        const validIds = new Set(limitedData.nodes.map(n => n.id));
        limitedData.edges = limitedData.edges
          .map(edge => ({
            ...edge,
            source: String(cleanId(edge.source)),
            target: String(cleanId(edge.target))
          }))
          .filter(e => validIds.has(e.source) && validIds.has(e.target));

        setGraphData(limitedData);
      } else {
        setGraphData({ nodes: [], edges: [] });
        setError('No network data found in database');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching network data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to load network data. Please ensure that your database instance is running');
      }
      setLoading(false);
    }
  };

  const limitGraphData = (data, maxTrans, maxTransfers) => {
    if (!data || !data.nodes || !data.edges) return data;
    
    const customers = data.nodes.filter(n => n.type === 'Customer');
    const accounts = data.nodes.filter(n => n.type === 'Account');
    const transactions = data.nodes.filter(n => n.type === 'Transaction').slice(0, maxTrans);
    const devices = data.nodes.filter(n => n.type === 'Device');
    const ipAddresses = data.nodes.filter(n => n.type === 'IPAddress');
    const locations = data.nodes.filter(n => n.type === 'Location');
    
    const transactionIds = new Set(transactions.map(t => t.id));
    
    let filteredEdges = data.edges.filter(e => {
      if (transactionIds.has(e.source) || transactionIds.has(e.target)) return true;
      return false;
    });
    
    const transferEdges = filteredEdges.filter(e => e.relationship === 'TRANSFERRED_TO');
    const otherEdges = filteredEdges.filter(e => e.relationship !== 'TRANSFERRED_TO');
    
    const sortedTransfers = [...transferEdges].sort((a, b) => (b.amount || 0) - (a.amount || 0));
    const limitedTransfers = sortedTransfers.slice(0, maxTransfers);
    
    const finalEdges = [...otherEdges, ...limitedTransfers];
    
    const connectedNodeIds = new Set();
    finalEdges.forEach(e => {
      if (e.source != null) connectedNodeIds.add(e.source);
      if (e.target != null) connectedNodeIds.add(e.target);
    });
    
    customers.forEach(c => connectedNodeIds.add(c.id));
    accounts.forEach(a => connectedNodeIds.add(a.id));
    
    const finalNodes = data.nodes.filter(n => connectedNodeIds.has(n.id));
    
    return { nodes: finalNodes, edges: finalEdges };
  };

  const aggregateTransferEdges = (edges) => {
    const transferMap = new Map();
    const otherEdges = [];
    
    edges.forEach(edge => {
      if (edge.relationship === 'TRANSFERRED_TO') {
        const key = `${edge.source}_${edge.target}`;
        if (transferMap.has(key)) {
          const existing = transferMap.get(key);
          existing.count = (existing.count || 1) + 1;
          existing.totalAmount = (existing.totalAmount || existing.amount) + edge.amount;
          existing.lastAmount = edge.amount;
          existing.lastTimestamp = edge.timestamp;
        } else {
          transferMap.set(key, { ...edge, count: 1, totalAmount: edge.amount });
        }
      } else {
        otherEdges.push(edge);
      }
    });
    
    const aggregatedTransfers = Array.from(transferMap.values()).map(transfer => ({
      ...transfer,
      label: transfer.count > 1 ? `${transfer.count}x transfers` : `$${transfer.amount?.toLocaleString()}`,
      title: `Total: $${transfer.totalAmount?.toLocaleString()} over ${transfer.count} transfers`,
      amount: transfer.totalAmount,
      width: Math.min(5, 2 + (transfer.count / 5))
    }));
    
    return [...otherEdges, ...aggregatedTransfers];
  };

  const getNodeColor = (type, isFlagged, riskScore) => {
    if (type === 'Customer') {
      if (riskScore >= 30) return { background: '#ef4444', border: '#7f1a1a' };
      if (riskScore >= 15) return { background: '#f59e0b', border: '#78350f' };
      return { background: '#60a5fa', border: '#1e3a5f' };
    }
    if (type === 'Account') {
      if (isFlagged) return { background: '#ef4444', border: '#7f1a1a' };
      return { background: '#10b981', border: '#064e3b' };
    }
    if (type === 'Transaction') {
      if (isFlagged) return { background: '#a78bfa', border: '#5b21b6' };
      return { background: '#a78bfa', border: '#5b21b6' };
    }
    if (type === 'Device') {
      return { background: '#f97316', border: '#7c2d12' };
    }
    if (type === 'IPAddress') {
      if (isFlagged) return { background: '#ef4444', border: '#7f1a1a' };
      return { background: '#06b6d4', border: '#164e63' };
    }
    if (type === 'Location') {
      if (isFlagged) return { background: '#ef4444', border: '#7f1a1a' };
      return { background: '#ec489a', border: '#831843' };
    }
    return { background: '#64748b', border: '#334155' };
  };

  const getNodeSize = (type, amount, riskScore) => {
    if (type === 'Transaction' && amount) return Math.min(25 + (amount / 1000), 45);
    if (type === 'Customer' && riskScore) return 18 + (riskScore / 3);
    if (type === 'Account') return 22;
    if (type === 'Device') return 18;
    if (type === 'IPAddress') return 18;
    if (type === 'Location') return 18;
    return 20;
  };

  const getFontSize = (type) => {
    if (type === 'Customer') return 12;
    if (type === 'Account') return 11;
    return 10;
  };

  const drawGraph = () => {
    if (!containerRef.current) return;

    if (networkInstanceRef.current) {
      networkInstanceRef.current.destroy();
    }

    let nodesToShow = graphData.nodes;
    let edgesToShow = [...graphData.edges];
    edgesToShow = aggregateTransferEdges(edgesToShow);

    if (filter === 'SUSPICIOUS') {
      const suspiciousIds = graphData.nodes
        .filter(n => n.isFlagged || (n.riskScore && n.riskScore >= 15))
        .map(n => n.id);
      nodesToShow = graphData.nodes.filter(n => suspiciousIds.includes(n.id));
      edgesToShow = edgesToShow.filter(e => suspiciousIds.includes(e.source) && suspiciousIds.includes(e.target));
    } else if (filter !== 'ALL') {
      nodesToShow = graphData.nodes.filter(n => n.type === filter);
      const nodeIds = new Set(nodesToShow.map(n => n.id));
      edgesToShow = edgesToShow.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    const visNodes = nodesToShow
      .filter(node => node.id != null && node.id !== '')
      .map(node => {
        const colors = getNodeColor(node.type, node.isFlagged, node.riskScore);
        const safeLabel = node.label && node.label.length > 25
          ? node.label.substring(0, 22) + '...'
          : (node.label || String(node.id));
        return {
          id: node.id,
          label: safeLabel,
          title: `${node.type}\n${node.label}\n${node.riskScore ? 'Risk Score: ' + node.riskScore : ''}${node.amount ? 'Amount: $' + node.amount.toLocaleString() : ''}${node.isFlagged ? '\nFLAGGED' : ''}`,
          color: {
            background: colors.background,
            border: colors.border,
            highlight: { background: colors.background, border: '#ffffff' }
          },
          font: { color: '#ffffff', size: getFontSize(node.type), face: 'Courier New' },
          size: getNodeSize(node.type, node.amount, node.riskScore),
          shape: node.type === 'Customer' ? 'dot' : 'box',
          borderWidth: node.isFlagged ? 3 : 1
        };
      });

    const visNodeIds = new Set(visNodes.map(n => n.id));
    const visEdges = edgesToShow
      .filter(edge => visNodeIds.has(edge.source) && visNodeIds.has(edge.target))
      .map((edge, idx) => {
        let color = '#64748b';
        let width = edge.width || 1;
        let dashes = false;
        if (edge.relationship === 'TRANSFERRED_TO') {
          color = '#f59e0b';
          width = Math.min(5, edge.width || (edge.amount > 20000 ? 4 : edge.amount > 10000 ? 3 : 2));
        }
        if (edge.relationship === 'MADE') color = '#a78bfa';
        if (edge.relationship === 'OWNS') color = '#60a5fa';
        if (edge.relationship === 'USED' || edge.relationship === 'USES_DEVICE') color = '#f97316';
        if (edge.relationship === 'FROM_IP') color = '#06b6d4';
        if (edge.relationship === 'OCCURRED_AT') color = '#ec489a';
        const uniqueId = `edge_${idx}_${Date.now()}`;
        return {
          id: uniqueId,
          from: edge.source,
          to: edge.target,
          label: edge.label || (edge.relationship === 'TRANSFERRED_TO' && edge.amount ? `$${edge.amount.toLocaleString()}` : ''),
          title: edge.title || `${edge.relationship}${edge.amount ? '\nAmount: $' + edge.amount.toLocaleString() : ''}${edge.count ? `\n${edge.count} total transfers` : ''}`,
          color: color,
          width: width,
          dashes: dashes,
          font: { size: 9, color: '#94a3b8', face: 'Courier New', align: 'middle' },
          smooth: { type: 'curvedCW', roundness: 0.2 },
          arrows: { to: { enabled: true, scaleFactor: 0.8 } }
        };
      });

    const options = {
      nodes: {
        shape: 'dot',
        scaling: { min: 15, max: 40 },
        font: { face: 'Courier New', size: 11, color: '#ffffff' },
        borderWidth: 1,
        shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 5 }
      },
      edges: {
        smooth: { type: 'curvedCW', roundness: 0.2 },
        arrows: { to: { enabled: true, scaleFactor: 0.8 } },
        font: { size: 9, color: '#94a3b8', face: 'Courier New', align: 'middle', strokeWidth: 0 },
        color: '#64748b',
        width: 1,
        hoverWidth: 2,
        selectionWidth: 2
      },
      physics: {
        enabled: true,
        stabilization: { iterations: 50, fit: true },
        barnesHut: { gravitationalConstant: -8000, centralGravity: 0.3, springLength: 95, springConstant: 0.04, damping: 0.09 }
      },
      interaction: { hover: true, tooltipDelay: 200, zoomView: true, dragView: true, navigationButtons: false },
      layout: { improvedLayout: true }
    };

    const data = { nodes: visNodes, edges: visEdges };
    try {
      networkInstanceRef.current = new VisNetwork(containerRef.current, data, options);
      networkInstanceRef.current.on('click', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const clickedNode = graphData.nodes.find(n => n.id === nodeId);
          if (clickedNode) setSelectedNode(clickedNode);
        } else {
          setSelectedNode(null);
        }
      });
    } catch (err) {
      console.error('Error creating network graph:', err);
      setError('Error rendering graph: ' + err.message);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchNetworkData();
  };

  const handleNavigate = (page, path) => {
    setActivePage(page);
    if (path) setTimeout(() => navigate(path), 150);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/logout', {}, { withCredentials: true });
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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

        <div className="network-controls">
          <div className="filter-section">
            <label className="filter-label">FILTER BY:</label>
            <div className="filter-buttons">
              <button className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>ALL</button>
              <button className={`filter-btn ${filter === 'Customer' ? 'active' : ''}`} onClick={() => setFilter('Customer')}>CUSTOMERS</button>
              <button className={`filter-btn ${filter === 'Account' ? 'active' : ''}`} onClick={() => setFilter('Account')}>ACCOUNTS</button>
              <button className={`filter-btn ${filter === 'Transaction' ? 'active' : ''}`} onClick={() => setFilter('Transaction')}>TRANSACTIONS</button>
              <button className={`filter-btn ${filter === 'SUSPICIOUS' ? 'active' : ''}`} onClick={() => setFilter('SUSPICIOUS')}>SUSPICIOUS ONLY</button>
            </div>
            <button className="filter-btn" onClick={handleRefresh} style={{ marginLeft: 'auto' }}>REFRESH</button>
          </div>
        </div>

        <div className="network-legend">
          <div className="legend-title">STATS</div>
          <div className="legend-items">
            <div className="legend-item"><span>Nodes: {graphData.nodes.length}</span></div>
            <div className="legend-item"><span>Edges: {graphData.edges.length}</span></div>
          </div>
        </div>

        <div className="network-legend">
          <div className="legend-title">LEGEND</div>
          <div className="legend-items">
            <div className="legend-item"><div className="legend-color" style={{ backgroundColor: '#60a5fa' }}></div><span>Customer (Low Risk)</span></div>
            <div className="legend-item"><div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div><span>Customer (Medium Risk)</span></div>
            <div className="legend-item"><div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div><span>Customer (High Risk) / Flagged</span></div>
            <div className="legend-item"><div className="legend-color" style={{ backgroundColor: '#10b981' }}></div><span>Account (Normal)</span></div>
            <div className="legend-item"><div className="legend-color" style={{ backgroundColor: '#a78bfa' }}></div><span>Transaction</span></div>
            <div className="legend-item"><div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div><span>Money Transfer</span></div>
          </div>
        </div>

        {error && <div className="error-message" style={{ marginBottom: '20px' }}>{error}</div>}

        <div className="network-graph-container">
          {graphData.nodes.length === 0 ? (
            <div className="graph-placeholder">
              <div className="graph-placeholder-icon">NO DATA FOUND</div>
              <div className="graph-placeholder-text">No network data available in the database.</div>
            </div>
          ) : (
            <div ref={containerRef} style={{ width: '100%', height: '600px', backgroundColor: 'rgba(10, 12, 18, 0.9)', borderRadius: '8px', border: '1px solid #1e293b' }} />
          )}
        </div>

        {selectedNode && (
          <div className="selected-node-panel">
            <div className="selected-node-header">
              <h3>NODE DETAILS</h3>
              <button className="close-panel" onClick={() => setSelectedNode(null)}>×</button>
            </div>
            <div className="selected-node-content">
              <div className="node-detail-row"><span className="node-detail-label">Type:</span><span className="node-detail-value">{selectedNode.type}</span></div>
              <div className="node-detail-row"><span className="node-detail-label">ID/Label:</span><span className="node-detail-value">{selectedNode.label}</span></div>
              {selectedNode.riskScore !== undefined && selectedNode.riskScore !== null && (
                <div className="node-detail-row"><span className="node-detail-label">Risk Score:</span><span className="node-detail-value">{selectedNode.riskScore}</span></div>
              )}
              {selectedNode.amount !== undefined && selectedNode.amount !== null && (
                <div className="node-detail-row"><span className="node-detail-label">Amount:</span><span className="node-detail-value">${selectedNode.amount.toLocaleString()}</span></div>
              )}
              {selectedNode.isFlagged && (
                <div className="node-detail-row"><span className="node-detail-label">Status:</span><span className="node-detail-value status-flagged">FLAGGED</span></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Network;