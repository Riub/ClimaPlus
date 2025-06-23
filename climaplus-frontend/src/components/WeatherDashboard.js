import React, { useState } from 'react';
import './WeatherDashboard.css';

const WeatherDashboard = ({ user }) => {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [favoriteSaved, setFavoriteSaved] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setError('');
    setFavoriteSaved(false);

    try {
      const response = await fetch(
        `http://localhost:3001/api/weather?city=${encodeURIComponent(city)}`
      );
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

  const saveToFavorites = async () => {
    if (!weatherData || !user) return;

    try {
      const response = await fetch('http://localhost:3001/api/favorites', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Si usas JWT
        },
        body: JSON.stringify({ 
          userId: user.id, 
          city: weatherData.name 
        }),
      });

      if (response.ok) {
        setFavoriteSaved(true);
        setTimeout(() => setFavoriteSaved(false), 3000); // Mensaje desaparece después de 3s
      }
    } catch (error) {
      console.error('Error al guardar favorito:', error);
    }
  };

  return (
    <div className="dashboard">
      {/* Barra de búsqueda */}
      <div className="weather-search-container">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Buscar ciudad..."
            className="search-input"
            disabled={loading}
          />
          <button 
            type="submit" 
            className="search-button"
            disabled={loading || !city.trim()}
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}
      </div>

      {/* Tarjeta del clima + botón favorito */}
      {weatherData && (
        <div className="weather-card">
          <div className="weather-header">
            <h2>{weatherData.name}, {weatherData.sys?.country}</h2>
            <button 
              onClick={saveToFavorites}
              className={`favorite-button ${favoriteSaved ? 'saved' : ''}`}
              disabled={favoriteSaved}
            >
              {favoriteSaved ? '✓ Guardado' : '★ Guardar en Favoritos'}
            </button>
          </div>

          <div className="weather-main">
            <img 
              src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`} 
              alt={weatherData.weather[0].description}
            />
            <span className="temperature">
              {Math.round(weatherData.main.temp)}°C
            </span>
          </div>

          <div className="weather-details">
            <p>{weatherData.weather[0].description}</p>
            <p>Humedad: {weatherData.main.humidity}%</p>
            <p>Viento: {Math.round(weatherData.wind.speed * 3.6)} km/h</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherDashboard;