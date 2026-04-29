import React, { useState } from 'react';
import ApiService from './api';

function CustomerSearch() {
  // State variables
  const [searchQuery, setSearchQuery] = useState('');  // Search input value
  const [searchResults, setSearchResults] = useState([]);  // Search results
  const [searching, setSearching] = useState(false);  // Search loading state
  const [selectedCustomer, setSelectedCustomer] = useState(null);  // Currently selected customer
  const [error, setError] = useState(null);  // Error state

  // Function to handle search
  const handleSearch = async () => {
    // Validate search input
    if (!searchQuery.trim()) {
      setError('Please enter a customer name, ID, or email to search.');
      return;
    }

    try {
      setSearching(true);
      setError(null);
      const results = await ApiService.searchCustomers(searchQuery);
      setSearchResults(results);
      setSelectedCustomer(null);  // Clear selected customer when new search is performed
      
      if (results.length === 0) {
        setError('No customers found matching your search criteria.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      setError('Failed to search customers. Please check if the backend server is running.');
    } finally {
      setSearching(false);
    }
  };

  // Function to handle Enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Function to select a customer and view details
  const handleSelectCustomer = async (customerId) => {
    try {
      setSearching(true);
      const customer = await ApiService.getCustomerById(customerId);
      setSelectedCustomer(customer);
    } catch (error) {
      console.error('Failed to fetch customer details:', error);
      setError('Failed to load customer details.');
    } finally {
      setSearching(false);
    }
  };

  // Function to clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedCustomer(null);
    setError(null);
  };

  return (
    <div>
      <h1>Customer Search</h1>
      
      {/* Search Bar Section */}
      <div className="card">
        <h3 className="card-title">Search Customers</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            className="search-bar"
            placeholder="Search by name, customer ID, or email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ marginBottom: 0 }}
          />
          <button 
            className="button"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
          <button 
            className="button"
            onClick={handleClearSearch}
            style={{ backgroundColor: '#95a5a6' }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card" style={{ backgroundColor: '#fee', borderLeft: '4px solid #e74c3c' }}>
          <p style={{ color: '#c62828', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Search Results Section */}
      {searchResults.length > 0 && !selectedCustomer && (
        <div className="card">
          <h3 className="card-title">Search Results ({searchResults.length})</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.id}</td>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>
                    <button 
                      className="button"
                      onClick={() => handleSelectCustomer(customer.id)}
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Details Section */}
      {selectedCustomer && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 className="card-title" style={{ marginBottom: 0 }}>Customer Details</h3>
            <button 
              className="button"
              onClick={() => setSelectedCustomer(null)}
              style={{ backgroundColor: '#95a5a6', padding: '5px 15px' }}
            >
              Back to Results
            </button>
          </div>
          
          <div className="grid-2">
            <div>
              <p><strong>Customer ID:</strong> {selectedCustomer.id}</p>
              <p><strong>Name:</strong> {selectedCustomer.name}</p>
              <p><strong>Email:</strong> {selectedCustomer.email}</p>
              <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
              <p><strong>Risk Score:</strong> 
                <span style={{
                  marginLeft: '10px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: (selectedCustomer.riskScore || 0) > 3 ? '#fee' : '#e8f5e9',
                  color: (selectedCustomer.riskScore || 0) > 3 ? '#c62828' : '#2e7d32'
                }}>
                  {(selectedCustomer.riskScore || 0) > 3 ? 'High Risk' : 'Normal'} ({selectedCustomer.riskScore || 0})
                </span>
              </p>
            </div>
            <div>
              <p><strong>Accounts Owned:</strong></p>
              <ul style={{ marginLeft: '20px' }}>
                {selectedCustomer.accounts && selectedCustomer.accounts.length > 0 ? (
                  selectedCustomer.accounts.map((account, index) => (
                    <li key={index}>{account}</li>
                  ))
                ) : (
                  <li>No accounts found</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="card">
        <h3 className="card-title">Search Tips</h3>
        <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
          <li>Search by <strong>Customer ID</strong> (e.g., C01, C02)</li>
          <li>Search by <strong>Name</strong> (e.g., Molapo, Bob)</li>
          <li>Search by <strong>Email</strong> (e.g., molapo@email.com)</li>
          <li>Partial matches are supported - typing "mol" will find "Molapo Rorisang"</li>
        </ul>
      </div>
    </div>
  );
}

export default CustomerSearch;