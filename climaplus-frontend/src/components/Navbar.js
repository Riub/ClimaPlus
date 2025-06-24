// src/components/NavBar.js
import React, { useEffect } from 'react';
import '../styles/NavBar.css';

const NavBar = ({ user, onLogout, favoritesCount, setView }) => {
  useEffect(() => {
    const handleScroll = () => {
      const nav = document.querySelector('.navbar');
      if (window.scrollY > 20) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="app-title">ClimaPlus</span>
        <button className="nav-button" onClick={() => setView('dashboard')}>🌤️ Clima</button>
        <button className="nav-button" onClick={() => setView('favorites')}>
          ⭐ Favoritos ({favoritesCount})
        </button>
      </div>
      <div className="navbar-right">
        <span className="user-name">{user.firstName} {user.lastName}</span>
        <button className="logout-button" onClick={onLogout}>Cerrar sesión</button>
      </div>
    </nav>
  );
};

export default NavBar;
