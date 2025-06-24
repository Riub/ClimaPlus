import React, { useEffect, useState } from 'react';
import NavBar from './Navbar';

const FavoritesView = ({ user, onLogout, setView }) => {
  const [favorites, setFavorites] = useState([]);
  const [weatherData, setWeatherData] = useState([]);

  // Obtener favoritos desde tu API
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/favorites?userId=${user.userId}`);
        const data = await res.json();
        if (Array.isArray(data)) setFavorites(data);
      } catch (err) {
        console.error('Error al obtener favoritos:', err);
      }
    };

    fetchFavorites();
  }, [user.userId]);

  // Obtener clima de favoritos
  useEffect(() => {
    const fetchWeather = async () => {
      const data = await Promise.all(
        favorites.map(async (city) => {
          try {
            const res = await fetch(`http://localhost:3001/api/weather?city=${encodeURIComponent(city)}`);
            const json = await res.json();
            return res.ok ? json : null;
          } catch {
            return null;
          }
        })
      );
      setWeatherData(data.filter(Boolean));
    };

    if (favorites.length > 0) fetchWeather();
    else setWeatherData([]);
  }, [favorites]);

  // Eliminar favorito
  const handleRemove = async (city) => {
    try {
      const res = await fetch('http://localhost:3001/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId, city })
      });
      if (res.ok) {
        setFavorites((prev) => prev.filter((c) => c !== city));
      }
    } catch (err) {
      console.error('Error al eliminar favorito:', err);
    }
  };

  return (
    <div className="favorites-dashboard">
      <NavBar user={user} onLogout={onLogout} favoritesCount={favorites.length} setView={setView} />
      <h2>Ciudades Favoritas</h2>

      {weatherData.length === 0 ? (
        <p>No tienes ciudades favoritas aún.</p>
      ) : (
        <div className="favorites-grid">
          {weatherData.map((weather) => (
            <div className="weather-card" key={weather.id}>
              <h3>{weather.name}, {weather.sys.country}</h3>
              <img 
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} 
                alt={weather.weather[0].description}
              />
              <p>{Math.round(weather.main.temp)}°C - {weather.weather[0].description}</p>
              <p>Humedad: {weather.main.humidity}% | Viento: {Math.round(weather.wind.speed * 3.6)} km/h</p>
              <button className="remove-button" onClick={() => handleRemove(weather.name)}>
                ❌ Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesView;
