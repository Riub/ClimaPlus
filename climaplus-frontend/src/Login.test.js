// climaplus-frontend/src/components/Login.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import '@testing-library/jest-dom'; // Asumimos que se carga globalmente por setupTests.js

import Login from './Login';

global.fetch = jest.fn();

describe('Login Component', () => {
  let mockOnLogin;

  beforeEach(() => {
    mockOnLogin = jest.fn();
    fetch.mockClear();

    fetch.mockImplementation((url, options) => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Default response' }),
      });
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });


  test('renders email and password input fields in login mode', () => {
    render(<Login onLogin={mockOnLogin} />);

    expect(screen.getByPlaceholderText(/Correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ingresar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /¿No tienes cuenta\? Regístrate/i })).toBeInTheDocument();

    expect(screen.queryByPlaceholderText(/Nombre/i)).toBeNull();
    expect(screen.queryByPlaceholderText(/Apellido/i)).toBeNull();
  });

  test('switches to registration mode and shows name/lastname fields', async () => {
    render(<Login onLogin={mockOnLogin} />);
    
    const toggleButton = screen.getByRole('button', { name: /¿No tienes cuenta\? Regístrate/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Registro')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Nombre/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Apellido/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Registrarse/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /¿Ya tienes cuenta\? Inicia sesión/i })).toBeInTheDocument();
  });


  test('handles successful registration', async () => {
    render(<Login onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByRole('button', { name: /¿No tienes cuenta\? Regístrate/i }));

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, user: { id: 1, firstName: 'Test', lastName: 'User', email: 'test@example.com' }, message: 'Registro exitoso' }),
    });

    fireEvent.change(screen.getByPlaceholderText(/Nombre/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText(/Apellido/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByPlaceholderText(/Correo electrónico/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Contraseña/i), { target: { value: 'securepassword' } });

    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ firstName: 'Test', lastName: 'User', email: 'test@example.com', password: 'securepassword' }),
        })
      );
      expect(screen.getByText('¡Registro exitoso! Redirigiendo...')).toBeInTheDocument();
    });

    jest.runAllTimers();

    expect(mockOnLogin).toHaveBeenCalledTimes(1);
    expect(mockOnLogin).toHaveBeenCalledWith(expect.objectContaining({ id: 1, email: 'test@example.com' }));
  });

  test('handles registration failure (e.g., email already registered)', async () => {
    render(<Login onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByRole('button', { name: /¿No tienes cuenta\? Regístrate/i }));

    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ success: false, error: 'El email ya está registrado' }),
    });

    fireEvent.change(screen.getByPlaceholderText(/Correo electrónico/i), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Contraseña/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(screen.getByText('El email ya está registrado')).toBeInTheDocument();
      expect(mockOnLogin).not.toHaveBeenCalled();
    });
  });

  test('handles successful login', async () => {
    render(<Login onLogin={mockOnLogin} />);

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ userId: 1, firstName: 'Test', lastName: 'User', email: 'test@example.com' }),
    });

    fireEvent.change(screen.getByPlaceholderText(/Correo electrónico/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Contraseña/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      );
      expect(mockOnLogin).toHaveBeenCalledTimes(1);
      expect(mockOnLogin).toHaveBeenCalledWith(expect.objectContaining({ userId: 1, email: 'test@example.com' }));
    });
  });

  test('handles login failure (invalid credentials)', async () => {
    render(<Login onLogin={mockOnLogin} />);

    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Credenciales inválidas' }),
    });

    fireEvent.change(screen.getByPlaceholderText(/Correo electrónico/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Contraseña/i), { target: { value: 'wrongpassword' } });

    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
      expect(mockOnLogin).not.toHaveBeenCalled();
    });
  });

  test('shows loading state during form submission', async () => {
    render(<Login onLogin={mockOnLogin} />);

    fetch.mockImplementation(() => new Promise(() => {}));

    fireEvent.change(screen.getByPlaceholderText(/Correo electrónico/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Contraseña/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cargando\.\.\./i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /¿No tienes cuenta\? Regístrate/i })).toBeDisabled();
    });
  });
});