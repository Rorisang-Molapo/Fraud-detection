import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './Login';
import Dashboard from './Dashboard';
import Customer from './Customer';
import Alerts from './Alerts';
import Network from './Network';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/check-auth', {
          withCredentials: true
        });
        setIsLoggedIn(response.data.authenticated);
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div style={{ backgroundColor: '#0a0c12', height: '100vh', color: '#60a5fa', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>LOADING...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
        <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
         <Route path="/customer" element={isLoggedIn ? <Customer /> : <Navigate to="/login" />} />
         <Route path="/alerts" element={isLoggedIn ? <Alerts /> : <Navigate to="/login" />} />
         <Route path="/network" element={isLoggedIn ? <Network /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;