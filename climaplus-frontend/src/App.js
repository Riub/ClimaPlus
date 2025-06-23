// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import WeatherDashboard from './components/WeatherDashboard';
import Favorites from './components/Favorites';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <div className="App">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        <Routes>
          <Route 
            path="/" 
            element={user ? <WeatherDashboard user={user} /> : <Login onLogin={setUser} />} 
          />
          <Route 
            path="/favorites" 
            element={user ? <Favorites userId={user.id} /> : <Login onLogin={setUser} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;