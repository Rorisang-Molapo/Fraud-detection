import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './App.css';

const Customer = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('customer');
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllCustomers();
  }, []);

  const fetchAllCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/customers', {
        withCredentials: true
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
      setError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async () => {
    if (!searchTerm.trim()) {
      fetchAllCustomers();
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/customers/search?q=${searchTerm}`, {
        withCredentials: true
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error searching customers:', error);
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const viewCustomerDetails = async (customerId) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/customers/${customerId}`, {
        withCredentials: true
      });
      setSelectedCustomer(response.data);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      setError('Failed to fetch customer details');
    } finally {
      setLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedCustomer(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchCustomers();
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

  const getRiskClass = (riskScore) => {
    if (riskScore >= 30) return 'risk-critical';
    if (riskScore >= 15) return 'risk-elevated';
    return 'risk-moderate';
  };

  const safeInt = (value) => {
    if (!value) return 0;
    if (typeof value === 'object' && value.low !== undefined) {
      return value.low; 
    }
  return value;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    if (typeof dateValue === 'object' && dateValue.year) {
      return dateValue.year + '-' + String(dateValue.month).padStart(2, '0') + '-' + String(dateValue.day).padStart(2, '0');
    }
    return String(dateValue);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    if (typeof timestamp === 'string') {
      const d = new Date(timestamp);
      return isNaN(d.getTime()) ? timestamp : d.toLocaleString();
    }
  
    if (typeof timestamp === 'object' && timestamp.year) {
      return formatDate(timestamp);
    }
    return String(timestamp);
  };

  if (loading && customers.length === 0) {
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

      <div className="sidebar" style={{ width: sidebarOpen ? '260px' : '60px' }}>
        <div className="sidebar-header">
          {sidebarOpen && <h2 className="sidebar-title">FEDERAL 20!</h2>}
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? '<' : '>'}
          </button>
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
        
        <button onClick={handleLogout} className="logout-nav-item">
          {sidebarOpen ? 'LOGOUT' : 'LO'}
        </button>
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
              <h1 className="header-title">FEDERAL 20! CUSTOMER MANAGEMENT</h1>
              <div className="status-bar">
                <span className="status-dot"></span>
                <span className="status-text">System status: OPERATIONAL</span>
                <span className="status-update">• Customer Database Online</span>
              </div>
            </div>
          </div>
        </div>

        <div className="search-section">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search by customer ID, name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="search-button" onClick={searchCustomers}>SEARCH</button>
            <button className="reset-button" onClick={fetchAllCustomers}>RESET</button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="results-count">
          Found {customers.length} customer{customers.length !== 1 ? 's' : ''}
        </div>

        <div className="table-container">
          {loading ? (
            <div className="loading-text">LOADING CUSTOMER DATA...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>RISK SCORE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {customers.length > 0 ? (
                  (customers || [])
                    .filter(c => c && typeof c === 'object')
                    .map((customer) => (
                    <tr key={customer.id}>
                      <td>{safeInt(customer.id)}</td>
                      <td>{safeInt(customer.name)}</td>
                      <td>{safeInt(customer.email)}</td>
                      <td>{safeInt(customer.phone)}</td>
                      <td>
                        <span className={`risk-badge ${getRiskClass(customer.riskScore)}`}>
                          {customer.riskScore}
                        </span>
                      </td>
                      <td>
                        <button className="view-button" onClick={() => viewCustomerDetails(safeInt(customer.id))}>
                          VIEW DETAILS
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-data">No customers found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {selectedCustomer && (
          <div className="modal-overlay" onClick={closeDetails}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">CUSTOMER DETAILS</h2>
                <button className="modal-close" onClick={closeDetails}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <span className="detail-label">Customer ID:</span>
                  <span className="detail-value">{selectedCustomer.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedCustomer.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedCustomer.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{selectedCustomer.phone}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Risk Score:</span>
                  <span className={`detail-value ${getRiskClass(selectedCustomer.riskScore)}`}>
                    {selectedCustomer.riskScore}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Join Date:</span>
                  <span className="detail-value">{formatDate(selectedCustomer.joinDate)}</span>
                </div>

                <div className="section-title">
                  <h3>ASSOCIATED ACCOUNTS</h3>
                </div>
                {selectedCustomer.accounts && selectedCustomer.accounts.length > 0 ? (
                  <table className="inner-table">
                    <thead>
                      <tr>
                        <th>Account Number</th>
                        <th>Type</th>
                        <th>Balance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.accounts.map((account) => (
                        <tr key={account.accountNumber}>
                          <td>{account.accountNumber}</td>
                          <td>{account.type}</td>
                          <td>${account.balance?.toLocaleString()}</td>
                          <td>
                            <span className={`status-badge ${account.isFlagged ? 'status-flagged' : 'status-active'}`}>
                              {account.isFlagged ? 'FLAGGED' : 'ACTIVE'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-data">No accounts associated</div>
                )}

                <div className="section-title">
                  <h3>RECENT TRANSACTIONS</h3>
                </div>
                {selectedCustomer.transactions && selectedCustomer.transactions.length > 0 ? (
                  <table className="inner-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.transactions.map((tx) => (
                        <tr key={tx.transactionId}>
                          <td>{tx.transactionId}</td>
                          <td>${tx.amount?.toLocaleString()}</td>
                          <td>{tx.type}</td>
                          {/* FIX: use formatTimestamp instead of new Date(...).toLocaleString()
                              directly, which crashes when timestamp is null or a non-ISO object */}
                          <td>{formatTimestamp(tx.timestamp)}</td>
                          <td>
                            <span className={`status-badge ${tx.isFlagged ? 'status-flagged' : 'status-active'}`}>
                              {tx.isFlagged ? 'FLAGGED' : 'NORMAL'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-data">No transactions found</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customer;