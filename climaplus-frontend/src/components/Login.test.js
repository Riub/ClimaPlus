// src/components/Login.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';

global.fetch = jest.fn();

describe('Login (modo de inicio de sesión)', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    fetch.mockClear();
    mockOnLogin.mockClear();
  });

  test('realiza login exitoso y llama a onLogin con los datos del usuario', async () => {
    // Simula la respuesta exitosa del backend
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        userId: 42,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com'
      })
    });

    render(<Login onLogin={mockOnLogin} />);

    fireEvent.change(screen.getByPlaceholderText(/Correo electrónico/i), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Contraseña/i), { target: { value: '12345678' } });

    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'jane@example.com', password: '12345678' })
        })
      );
      expect(mockOnLogin).toHaveBeenCalledWith({
        userId: 42,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com'
      });
    });
  });
});
