import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Favorites.css';

const Favorites = ({ userId }) => {
  const [favorites, setFavorites] = useState([]);
  const [newCity, setNewCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Obtener favoritos al cargar
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3001/api/favorites?userId=${userId}`
        );
        setFavorites(response.data);
      } catch (err) {
        setError('Error al cargar favoritos');
        console.error(err);
      }
    };
    
    if (userId) fetchFavorites();
  }, [userId]);

  // Agregar favorito
  const addFavorite = async () => {
    if (!newCity.trim()) {
      setError('Ingresa una ciudad válida');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await axios.post('http://localhost:3001/api/favorites', {
        userId,
        city: newCity.trim()
      });
      
      setFavorites([newCity, ...favorites]); // Agrega al inicio
      setNewCity('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar favorito
  const removeFavorite = async (city) => {
    try {
      await axios.delete('http://localhost:3001/api/favorites', {
        data: { userId, city }
      });
      
      setFavorites(favorites.filter(fav => fav !== city));
    } catch (err) {
      setError('Error al eliminar');
      console.error(err);
    }
  };

  return (
    <div className="favorites-container">
      <h3>Mis Ciudades Favoritas</h3>
      
      <div className="favorites-form">
        <input
          type="text"
          value={newCity}
          onChange={(e) => setNewCity(e.target.value)}
          placeholder="Ej: Madrid"
          disabled={loading}
          onKeyPress={(e) => e.key === 'Enter' && addFavorite()}
        />
        <button 
          onClick={addFavorite} 
          disabled={loading}
        >
          {loading ? 'Agregando...' : 'Agregar'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <ul className="favorites-list">
        {favorites.map((city) => (
          <li key={city}>
            <span>{city}</span>
            <button
              onClick={() => removeFavorite(city)}
              className="delete-btn"
              title="Eliminar de favoritos"
            >
              ×
            </button>
          </li>
        ))}
        
        {favorites.length === 0 && (
          <li className="empty-message">No hay ciudades favoritas</li>
        )}
      </ul>
    </div>
  );
};

export default Favorites;