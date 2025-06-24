import React, { useState } from 'react';
import '../styles/Login.css';



const Login = ({ onLogin }) => {
  // Estados para registro/login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const endpoint = isRegistering ? '/api/register' : '/api/login';
    const requestBody = isRegistering 
      ? { firstName, lastName, email, password }
      : { email, password };
    
    try {
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error desconocido');
      }

      if (isRegistering) {
        setSuccess('¡Registro exitoso! Redirigiendo...');
        setTimeout(() => onLogin(data.user), 1500); // Ahora pasa data.user completo
      } else {
        onLogin({ // Construye objeto con todos los datos
          userId: data.userId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        });
      }
    } catch (error) {
      setError(error.message);
      if (error.message.includes('email')) {
        setEmail('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>{isRegistering ? 'Registro' : 'Inicio de Sesión'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        {isRegistering && (
          <>
            <input
              type="text"
              placeholder="Nombre"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className={error.includes('nombre') ? 'input-error' : ''}
            />
            <input
              type="text"
              placeholder="Apellido"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className={error.includes('apellido') ? 'input-error' : ''}
            />
          </>
        )}
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={error.includes('email') ? 'input-error' : ''}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={isRegistering ? 6 : undefined}
          className={error.includes('contraseña') ? 'input-error' : ''}
        />
        <button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? (
            'Cargando...'
          ) : isRegistering ? (
            'Registrarse'
          ) : (
            'Ingresar'
          )}
        </button>
      </form>

      <button 
        className="toggle-mode"
        onClick={() => {
          setIsRegistering(!isRegistering);
          setError('');
          setSuccess('');
          // Limpiar campos al cambiar de modo
          if (!isRegistering) {
            setFirstName('');
            setLastName('');
          }
        }}
        disabled={isLoading}
      >
        {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
      </button>
    </div>
  );
};

export default Login;