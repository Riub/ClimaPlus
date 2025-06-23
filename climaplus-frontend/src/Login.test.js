// climaplus-frontend/src/components/Login.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; 
import Login from './components/Login';


global.fetch = jest.fn();


describe('Login Component', () => {
  let mockOnLogin; 

  // Limpiar mocks antes de cada test
  beforeEach(() => {
    mockOnLogin = jest.fn(); 
    fetch.mockClear(); 
  });

  // --- Test 1: Renderiza campos ---
  test('renders email and password input fields', () => {
    render(<Login onLogin={mockOnLogin} />); // Pasa el mock al componente

    expect(screen.getByPlaceholderText(/Correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ingresar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /¿No tienes cuenta? Regístrate/i })).toBeInTheDocument();
  });

  // --- Test 2: Cambiar a modo registro ---
  test('switches to registration mode', () => {
    render(<Login onLogin={mockOnLogin} />);
    
    fireEvent.click(screen.getByRole('button', { name: /¿No tienes cuenta? Regístrate/i }));

    expect(screen.getByText('Registro')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Apellido/i)).toBeInTheDocument();
  });


  // --- Test 3: Registro exitoso ---
  test('handles successful registration', async () => {
    render(<Login onLogin={mockOnLogin} />);

    // Cambiar a modo registro
    fireEvent.click(screen.getByRole('button', { name: /¿No tienes cuenta? Regístrate/i }));

    // Mockear la respuesta exitosa de fetch para el registro
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, user: { id: 1, firstName: 'Test', lastName: 'User', email: 'test@example.com' }, message: 'Registro exitoso' }),
    });

    // Llenar campos de registro
    fireEvent.change(screen.getByPlaceholderText(/Nombre/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText(/Apellido/i), { target: { value: 'User' } });
    fireEvent.change(screen.getByPlaceholderText(/Correo electrónico/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Contraseña/i), { target: { value: 'securepassword' } });

    // Enviar formulario
    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    // Esperar a que la operación asíncrona termine y que onLogin sea llamado
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ firstName: 'Test', lastName: 'User', email: 'test@example.com', password: 'securepassword' }),
        })
      );
      expect(mockOnLogin).toHaveBeenCalledTimes(1);
      expect(mockOnLogin).toHaveBeenCalledWith(expect.objectContaining({ id: 1, email: 'test@example.com' }));
      expect(screen.getByText('¡Registro exitoso! Redirigiendo...')).toBeInTheDocument();
    });
  });

  // --- Test 4: Registro fallido (ej. email ya registrado) ---
  test('handles registration failure (e.g., email already registered)', async () => {
    render(<Login onLogin={mockOnLogin} />);
    fireEvent.click(screen.getByRole('button', { name: /¿No tienes cuenta? Regístrate/i }));

    fetch.mockResolvedValueOnce({
      ok: false, // Simula una respuesta HTTP no exitosa
      json: () => Promise.resolve({ success: false, error: 'El email ya está registrado' }),
    });

    // Llenar campos
    fireEvent.change(screen.getByPlaceholderText(/Correo electrónico/i), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Contraseña/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(screen.getByText('El email ya está registrado')).toBeInTheDocument();
      expect(mockOnLogin).not.toHaveBeenCalled(); // onLogin no debería ser llamado en caso de error
    });
  });

  // --- Test 5: Login exitoso ---
  test('handles successful login', async () => {
    render(<Login onLogin={mockOnLogin} />);

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ userId: 1, firstName: 'Test', lastName: 'User', email: 'test@example.com' }),
    });

    // Llenar campos de login
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

  // --- Test 6: Login fallido (credenciales inválidas) ---
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

});