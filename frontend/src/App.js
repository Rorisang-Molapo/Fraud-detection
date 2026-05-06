import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './Login';
import Dashboard from './Dashboard';
import Customer from './Customer';
import Alerts from './Alerts';
import Network from './Network';
import Reports from './Reports';
import CustomerDashboard from './CustomerDashboard';  

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/check-auth', {
          withCredentials: true
        });
        setIsLoggedIn(response.data.authenticated);
        
        
        if (response.data.authenticated) {
          try {
            const dashboardRes = await axios.get('http://localhost:5000/api/customer/dashboard', {
              withCredentials: true
            });
            if (dashboardRes.data.isAdmin) {
              setUserRole('admin');
            } else if (dashboardRes.data.isCustomer) {
              setUserRole('customer');
            }
          } catch (err) {
            
            setUserRole('admin');
          }
        }
      } catch (error) {
        setIsLoggedIn(false);
        setUserRole(null);
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
        <Route path="/login" element={<Login onLogin={() => {
          setIsLoggedIn(true);
          // Refresh page to reload role
          window.location.href = '/';
        }} />} />
        
        {/* Admin Routes */}
        <Route path="/dashboard" element={
          isLoggedIn && userRole === 'admin' ? <Dashboard /> : <Navigate to="/login" />
        } />
        <Route path="/customer" element={
          isLoggedIn && userRole === 'admin' ? <Customer /> : <Navigate to="/login" />
        } />
        <Route path="/alerts" element={
          isLoggedIn && userRole === 'admin' ? <Alerts /> : <Navigate to="/login" />
        } />
        <Route path="/network" element={
          isLoggedIn && userRole === 'admin' ? <Network /> : <Navigate to="/login" />
        } />
        <Route path="/reports" element={
          isLoggedIn && userRole === 'admin' ? <Reports /> : <Navigate to="/login" />
        } />
        
        {/* Customer Route */}
        <Route path="/customer-dashboard" element={
          isLoggedIn && userRole === 'customer' ? <CustomerDashboard /> : <Navigate to="/login" />
        } />
        
        {/* Default redirect based on role */}
        <Route path="/" element={
          isLoggedIn ? (
            userRole === 'admin' ? <Navigate to="/dashboard" /> : <Navigate to="/customer-dashboard" />
          ) : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;