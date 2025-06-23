// src/components/Login.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; 
import Login from './components/Login';

global.fetch = jest.fn();

describe('Login Component', () => {
  let mockOnLogin;

  beforeEach(() => {
    mockOnLogin = jest.fn();
    fetch.mockClear();
  });

  test('renders email and password input fields', () => {
    render(<Login onLogin={mockOnLogin} />);

    expect(screen.getByPlaceholderText(/Correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ingresar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /¿No tienes cuenta\? Regístrate/i })).toBeInTheDocument();
  });

  test('switches to registration mode', () => {
    render(<Login onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByRole('button', { name: /¿No tienes cuenta\? Regístrate/i }));

    expect(screen.getByText('Registro')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Apellido/i)).toBeInTheDocument();
  });

  test('handles successful registration', async () => {
    render(<Login onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByRole('button', { name: /¿No tienes cuenta\? Regístrate/i }));

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, user: { id: 1, firstName: 'Test', lastName: 'User', email: 'test@example.com' } }),
    });

    fireEvent.change(screen.getByPlaceholderText(/Nombre/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText(/Apellido/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByPlaceholderText(/Correo electrónico/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Contraseña/i), { target: { value: 'securepassword' } });
    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/register'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockOnLogin).toHaveBeenCalledWith(expect.objectContaining({ id: 1, email: 'test@example.com' }));
      expect(screen.getByText('¡Registro exitoso! Redirigiendo...')).toBeInTheDocument();
    });
  });

  test('handles registration failure (email already registered)', async () => {
    render(<Login onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByRole('button', { name: /¿No tienes cuenta\? Regístrate/i }));

    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'El email ya está registrado' }),
    });

    fireEvent.change(screen.getByPlaceholderText(/Correo electrónico/i), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Contraseña/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    await waitFor(() => {
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
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/login'),
        expect.objectContaining({ method: 'POST' })
      );
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
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
      expect(mockOnLogin).not.toHaveBeenCalled();
    });
  });

  test('shows loading state during login', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ userId: 1, firstName: 'Test', lastName: 'User', email: 'test@example.com' }),
    });

    render(<Login onLogin={mockOnLogin} />);
    fireEvent.change(screen.getByPlaceholderText(/Correo electrónico/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Contraseña/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    expect(screen.getByRole('button')).toHaveTextContent('Cargando...');
    await waitFor(() => expect(mockOnLogin).toHaveBeenCalled());
  });
});
