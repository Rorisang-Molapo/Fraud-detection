import React, { useState, useEffect } from 'react';
import ApiService from './api';

function FraudAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await ApiService.getFraudAlerts();
        setAlerts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const getSeverityStyle = (sev) => {
    if (sev === 'CRITICAL') return { borderLeft: '5px solid #e74c3c', backgroundColor: '#fff5f5' };
    if (sev === 'HIGH') return { borderLeft: '5px solid #f39c12', backgroundColor: '#fffaf0' };
    return { borderLeft: '5px solid #3498db', backgroundColor: '#f0f7ff' };
  };

  if (loading) return <div className="card">Analyzing network for fraud...</div>;

  return (
    <div>
      <h1>Fraud Alerts</h1>
      {alerts.length === 0 ? (
        <div className="card"><p>No suspicious patterns detected in the current network.</p></div>
      ) : (
        alerts.map((alert, i) => (
          <div key={i} className="card" style={getSeverityStyle(alert.severity)}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: '0 0 10px 0' }}>{alert.type.replace('_', ' ')}</h3>
                <p>{alert.message}</p>
                <small>Pattern Detected: {new Date(alert.timestamp).toLocaleString()}</small>
              </div>
              <span style={{ 
                backgroundColor: alert.severity === 'CRITICAL' ? '#e74c3c' : '#f39c12',
                color: 'white', padding: '5px 10px', borderRadius: '4px', height: 'fit-content'
              }}>
                {alert.severity}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default FraudAlerts;