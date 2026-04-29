import React, { useState, useEffect } from 'react';
import ApiService from './api';

function NetworkVisualization() {
  const [accountNumber, setAccountNumber] = useState('9010800100585');
  const [network, setNetwork] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accountNumber) fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getTransactionNetwork(accountNumber);
      setNetwork(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Transaction Network Analysis</h1>
      <div className="card">
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            className="search-bar" 
            value={accountNumber} 
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Enter Account Number..."
          />
          <button className="button" onClick={fetchNetworkData}>Analyze Graph</button>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Live Transaction Map</h3>
        {loading ? <p>Querying Neo4j...</p> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Target</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {network.edges.map((edge, i) => (
                <tr key={i}>
                  <td>{edge.from}</td>
                  <td>{edge.to}</td>
                  <td><span className="badge">{edge.type}</span></td>
                  <td style={{ fontWeight: 'bold' }}>M {edge.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default NetworkVisualization;