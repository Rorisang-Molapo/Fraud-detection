import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './App.css';

const CustomerDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [transferForm, setTransferForm] = useState({
        fromAccount: '',
        toAccount: '',
        amount: '',
        reference: ''
    });
    const [transferStatus, setTransferStatus] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/customer/dashboard', {
                withCredentials: true
            });
            
            console.log('Dashboard data:', response.data);
            
            if (response.data.isAdmin) {
                navigate('/dashboard');
                return;
            }
            
            setData(response.data);
            if (response.data.accounts && response.data.accounts.length > 0) {
                setTransferForm(prev => ({
                    ...prev,
                    fromAccount: response.data.accounts[0].accountNumber
                }));
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
            setLoading(false);
        }
    };

    const handleTransferChange = (e) => {
        setTransferForm({
            ...transferForm,
            [e.target.name]: e.target.value
        });
    };

    const searchAccount = async () => {
        if (!transferForm.toAccount || transferForm.toAccount.length < 3) return;
        
        try {
            const response = await axios.get(`http://localhost:5000/api/customer/search-account?q=${transferForm.toAccount}`, {
                withCredentials: true
            });
            console.log('Search results:', response.data);
            setSearchResults(response.data);
            setShowSearch(true);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const selectAccount = (accountNumber) => {
        setTransferForm(prev => ({
            ...prev,
            toAccount: accountNumber.toString()
        }));
        setShowSearch(false);
        setSearchResults([]);
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        
        const fromAcc = parseInt(transferForm.fromAccount);
        const toAcc = parseInt(transferForm.toAccount);
        const amountNum = parseFloat(transferForm.amount);
        
        console.log('Transfer details:', {
            fromAccountNumber: fromAcc,
            toAccountNumber: toAcc,
            amount: amountNum,
            reference: transferForm.reference || 'Online transfer'
        });
        
        setTransferStatus({ type: 'info', message: 'Processing transfer...' });
        
        try {
            const response = await axios.post('http://localhost:5000/api/customer/transfer', {
                fromAccountNumber: fromAcc,
                toAccountNumber: toAcc,
                amount: amountNum,
                reference: transferForm.reference || 'Online transfer'
            }, { withCredentials: true });
            
            console.log('Transfer response:', response.data);
            
            setTransferStatus({ type: 'success', message: response.data.message });
            if (response.data.isFlagged) {
                setTransferStatus({ type: 'warning', message: response.data.message + ' - This transaction has been flagged for review.' });
            }
            
            // Clear form
            setTransferForm(prev => ({ ...prev, toAccount: '', amount: '', reference: '' }));
            
            // Refresh data to show updated balances
            await fetchData();
            
            setTimeout(() => setTransferStatus(null), 5000);
        } catch (error) {
            console.error('Transfer error:', error.response?.data || error);
            setTransferStatus({ type: 'error', message: error.response?.data?.error || 'Transfer failed' });
            setTimeout(() => setTransferStatus(null), 5000);
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

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString();
    };

    const formatAccountNumber = (number) => {
        if (!number) return 'N/A';
        const str = number.toString();
        return '****' + str.slice(-4);
    };

    const getRiskBadge = (score) => {
        if (score >= 30) return <span className="badge badge-danger">HIGH RISK</span>;
        if (score >= 15) return <span className="badge badge-warning">MEDIUM RISK</span>;
        return <span className="badge badge-success">LOW RISK</span>;
    };

    if (loading) {
        return (
            <div className="customer-loading">
                <div className="spinner"></div>
                <p>Loading your accounts...</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="customer-app">
            {/* Header */}
            <div className="customer-header">
                <div className="logo">
                    <h1>FEDERAL 20!</h1>
                    <span>Online Banking</span>
                </div>
                <div className="user-info">
                    <span className="welcome">Welcome, {data.name}</span>
                    <button onClick={handleLogout} className="logout-button">Logout</button>
                </div>
            </div>

            {/* Main */}
            <div className="customer-main">
                {/* Sidebar */}
                <div className="sidebar">
                    <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
                        Overview
                    </button>
                    <button className={activeTab === 'transfer' ? 'active' : ''} onClick={() => setActiveTab('transfer')}>
                        Send Money
                    </button>
                    <button className={activeTab === 'transactions' ? 'active' : ''} onClick={() => setActiveTab('transactions')}>
                        Transactions
                    </button>
                    <button className={activeTab === 'accounts' ? 'active' : ''} onClick={() => setActiveTab('accounts')}>
                        Accounts
                    </button>
                </div>

                {/* Content */}
                <div className="content">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div>
                            <div className="welcome-card">
                                <h2>Welcome back, {data.name}!</h2>
                                <div className="risk-section">
                                    <span>Your Risk Score: {data.riskScore || 0}</span>
                                    {getRiskBadge(data.riskScore || 0)}
                                </div>
                                <div className="member-since">
                                    Member since: {new Date(data.joinDate).toLocaleDateString()}
                                </div>
                            </div>

                            {/* Balance Cards */}
                            <div className="balance-cards">
                                {data.accounts?.map((acc, idx) => (
                                    <div key={idx} className="balance-card">
                                        <div className="card-info">
                                            <div className="card-type">{acc.type?.toUpperCase()} Account</div>
                                            <div className="card-number">{formatAccountNumber(acc.accountNumber)}</div>
                                            <div className="card-balance">${acc.balance?.toLocaleString()}</div>
                                            {acc.isFlagged && <span className="flagged-tag">FLAGGED</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total Balance */}
                            <div className="total-balance">
                                <h3>Total Balance</h3>
                                <div className="total-amount">${data.totalBalance?.toLocaleString()}</div>
                            </div>

                            {/* Recent Activity */}
                            <div className="recent-activity">
                                <h3>Recent Activity</h3>
                                {data.recentTransactions && data.recentTransactions.length > 0 ? (
                                    data.recentTransactions.slice(0, 5).map((tx, idx) => (
                                        <div key={idx} className="activity-item">
                                            <div className="activity-details">
                                                <div className="activity-title">
                                                    {tx.type === 'transfer' ? 'Money Transfer' : 'Purchase'}
                                                    {tx.isFlagged && <span className="flagged-badge-small">Flagged</span>}
                                                </div>
                                                <div className="activity-date">{formatDate(tx.timestamp)}</div>
                                                {tx.merchant && <div className="activity-merchant">{tx.merchant}</div>}
                                            </div>
                                            <div className="activity-amount">-${tx.amount?.toLocaleString()}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-data">No recent transactions</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Transfer Tab */}
                    {activeTab === 'transfer' && (
                        <div className="transfer-card">
                            <h2>Send Money</h2>
                            
                            {transferStatus && (
                                <div className={`alert alert-${transferStatus.type}`}>
                                    {transferStatus.message}
                                </div>
                            )}
                            
                            <form onSubmit={handleTransfer}>
                                <div className="form-group">
                                    <label>From Account</label>
                                    <select name="fromAccount" value={transferForm.fromAccount} onChange={handleTransferChange} required>
                                        {data.accounts?.map((acc, idx) => (
                                            <option key={idx} value={acc.accountNumber}>
                                                {acc.type?.toUpperCase()} - {formatAccountNumber(acc.accountNumber)} (${acc.balance?.toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label>To Account Number</label>
                                    <div className="search-wrapper">
                                        <input
                                            type="text"
                                            name="toAccount"
                                            placeholder="Enter account number"
                                            value={transferForm.toAccount}
                                            onChange={handleTransferChange}
                                            onKeyUp={searchAccount}
                                            required
                                        />
                                        {showSearch && searchResults.length > 0 && (
                                            <div className="search-dropdown">
                                                {searchResults.map((acc, idx) => (
                                                    <div key={idx} className="search-item" onClick={() => selectAccount(acc.accountNumber)}>
                                                        <span>Account: {acc.accountNumber}</span>
                                                        <span>Owner: {acc.ownerName}</span>
                                                        <span>{acc.type}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Amount (USD)</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        placeholder="0.00"
                                        value={transferForm.amount}
                                        onChange={handleTransferChange}
                                        step="0.01"
                                        min="0.01"
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Reference (Optional)</label>
                                    <input
                                        type="text"
                                        name="reference"
                                        placeholder="Payment for..."
                                        value={transferForm.reference}
                                        onChange={handleTransferChange}
                                    />
                                </div>
                                
                                <button type="submit" className="transfer-button">Send Money</button>
                            </form>
                        </div>
                    )}

                    {/* Transactions Tab */}
                    {activeTab === 'transactions' && (
                        <div className="transactions-card">
                            <h2>Transaction History</h2>
                            
                            <div className="transaction-list">
                                {data.recentTransactions && data.recentTransactions.length > 0 ? (
                                    data.recentTransactions.map((tx, idx) => (
                                        <div key={idx} className="transaction-item">
                                            <div>
                                                <div className="transaction-id">{tx.id}</div>
                                                <div className="transaction-type">
                                                    {tx.type?.toUpperCase()}
                                                    {tx.isFlagged && <span className="flagged-badge-small">Flagged</span>}
                                                </div>
                                                <div className="transaction-date">{formatDate(tx.timestamp)}</div>
                                                {tx.location && <div className="transaction-location">Location: {tx.location}</div>}
                                            </div>
                                            <div className="transaction-amount">${tx.amount?.toLocaleString()}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-data">No transactions found</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Accounts Tab */}
                    {activeTab === 'accounts' && (
                        <div className="accounts-card">
                            <h2>Your Accounts</h2>
                            
                            {data.accounts?.map((acc, idx) => (
                                <div key={idx} className="account-detail">
                                    <div className="account-header">
                                        <h3>{acc.type?.toUpperCase()} Account</h3>
                                        <span className={`status-badge ${acc.isFlagged ? 'status-flagged' : 'status-active'}`}>
                                            {acc.isFlagged ? 'FLAGGED' : 'ACTIVE'}
                                        </span>
                                    </div>
                                    <div className="account-number">Account Number: {acc.accountNumber}</div>
                                    <div className="account-balance">Balance: ${acc.balance?.toLocaleString()}</div>
                                    {acc.isFlagged && (
                                        <div className="account-warning">This account has been flagged for review</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};



// Function to show toast popup
const showToast = (message, type = 'success') => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <div class="toast-icon">💰</div>
        <div class="toast-content">
            <div class="toast-title">Money Received</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    // Add styles
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1e293b;
        border-left: 4px solid #10b981;
        border-radius: 8px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 9999;
        font-family: 'Courier New', monospace;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        animation: slideInToast 0.3s ease forwards;
        min-width: 280px;
    `;
    
    document.body.appendChild(toast);

    // timeout 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutToast 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};


if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideInToast {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutToast {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}


//  polling to check for new money received
const CustomerDashboardWithToast = (props) => {
    const [lastBalance, setLastBalance] = useState(null);
    const originalData = props.data;
    
    useEffect(() => {
        if (originalData?.totalBalance && lastBalance === null) {
            setLastBalance(originalData.totalBalance);
        }
    }, [originalData?.totalBalance]);
    
    useEffect(() => {
        if (originalData?.totalBalance && lastBalance !== null && originalData.totalBalance > lastBalance) {
            const amountReceived = originalData.totalBalance - lastBalance;
            showToast(`You received $${amountReceived.toLocaleString()}!`);
        }
        if (originalData?.totalBalance) {
            setLastBalance(originalData.totalBalance);
        }
    }, [originalData?.totalBalance]);
    
    // Poll for new transactions every 10 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/customer/dashboard', {
                    withCredentials: true
                });
                if (response.data.totalBalance && lastBalance !== null && response.data.totalBalance > lastBalance) {
                    const amountReceived = response.data.totalBalance - lastBalance;
                    showToast(`You received $${amountReceived.toLocaleString()}!`);
                    setLastBalance(response.data.totalBalance);
                    // Refresh the component data
                    if (props.fetchData) {
                        props.fetchData();
                    }
                } else if (response.data.totalBalance) {
                    setLastBalance(response.data.totalBalance);
                }
            } catch (err) {
            
                console.log('Toast check failed:', err.message);
            }
        }, 10000);
        
        return () => clearInterval(interval);
    }, [lastBalance]);
    
    return <CustomerDashboard {...props} />;
};

export default CustomerDashboard;