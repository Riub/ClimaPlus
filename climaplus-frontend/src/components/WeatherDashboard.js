import React, { useState } from 'react';
import NavBar from './NavBar';
import SearchBar from './SearchBar';
import WeatherCard from './WeatherCard';
import ErrorMessage from './ErrorMessage';
import '../styles/WeatherDashboard.css';

const WeatherDashboard = ({ user, onLogout, favorites, setFavorites, setView }) => {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:3001/api/weather?city=${encodeURIComponent(city)}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Ciudad no encontrada');

      setWeatherData(data);
    } catch (err) {
      setError(err.message);
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFavorite = async () => {
    if (weatherData && !favorites.includes(weatherData.name)) {
      try {
        await fetch('http://localhost:3001/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.userId, city: weatherData.name })
        });
        setFavorites([...favorites, weatherData.name]);
      } catch (err) {
        console.error('Error al guardar favorito:', err);
      }
    }
  };

  return (
    <>
      <NavBar user={user} onLogout={onLogout} favoritesCount={favorites.length} setView={setView} />
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Bienvenido, {user.firstName}</h1>
          <p className="email">{user.email}</p>
        </div>

        <div className="weather-search-container">
          <SearchBar city={city} setCity={setCity} onSearch={handleSearch} loading={loading} />
          {error && <ErrorMessage message={error} />}
        </div>

        <div className="dashboard-main">
          {weatherData && (
            <WeatherCard
              weatherData={weatherData}
              onAddFavorite={handleAddFavorite}
              isFavorite={favorites.includes(weatherData.name)}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default WeatherDashboard;
