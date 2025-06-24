// src/App.js
import React, { useState } from 'react';
import Login from './components/Login';
import WeatherDashboard from './components/WeatherDashboard';
import FavoritesView from './components/FavoritesView'; // Asegúrate de crearlo o importarlo
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [favorites, setFavorites] = useState([]);

  const handleLogout = () => {
    setUser(null);
    setView('dashboard');
    setFavorites([]);
  };

  return (
    <div className="App">
      {!user ? (
        <Login onLogin={setUser} />
      ) : view === 'dashboard' ? (
        <WeatherDashboard 
          user={user}
          onLogout={handleLogout}
          setView={setView}
          favorites={favorites}
          setFavorites={setFavorites}
        />
      ) : (
        <FavoritesView 
          user={user}
          onLogout={handleLogout}
          setView={setView}
          favorites={favorites}
        />
      )}
    </div>
  );
}

export default App;
