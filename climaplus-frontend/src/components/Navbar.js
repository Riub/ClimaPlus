// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom'; // Si usas React Router
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">ClimaPlus</Link>
      </div>
      
      <div className="navbar-links">
        {user && (
          <>
            <Link to="/favorites" className="nav-link">
              Mis Favoritos
            </Link>
            <button onClick={onLogout} className="logout-button">
              Cerrar Sesión
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;