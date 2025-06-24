// src/components/WeatherCard.js
import React from 'react';
import '../styles/WeatherDashboard.css'; // o donde tengas la clase fade-in definida

const WeatherCard = ({ weatherData, onAddFavorite, isFavorite }) => (
  <div className="weather-card fade-in">
    <h2>{weatherData.name}, {weatherData.sys?.country}</h2>
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
    <button
      className={`favorite-button ${isFavorite ? 'saved' : ''}`}
      onClick={onAddFavorite}
      disabled={isFavorite}
    >
      {isFavorite ? '✅ Guardado' : '⭐ Agregar a favoritos'}
    </button>
  </div>
);

export default WeatherCard;
