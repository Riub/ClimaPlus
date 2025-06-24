// src/components/SearchBar.js
import React from 'react';

const SearchBar = ({ city, setCity, onSearch, loading }) => (
  <form onSubmit={onSearch} className="search-form">
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
);

export default SearchBar;
