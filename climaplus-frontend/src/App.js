import React, { useState } from 'react';
import Login from './components/Login';
import WeatherDashboard from './components/WeatherDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  return (
    <div className="App">
      {!user ? (
        <Login onLogin={setUser} />
      ) : (
        <WeatherDashboard user={user} />
      )}
    </div>
  );
}

export default App;