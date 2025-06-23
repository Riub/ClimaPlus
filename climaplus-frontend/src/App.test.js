import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Prueba para verificar que un componente se renderiza con cierto texto
test('renders welcome message in App component', () => {
  render(<App />);
  const linkElement = screen.getByText(/Welcome to ClimaPlus/i); // Asumiendo que tu App tiene un texto de bienvenida
  expect(linkElement).toBeInTheDocument();
});

// Puedes añadir una prueba para un componente específico, por ejemplo, Login
// `climaplus-frontend/src/components/Login.test.js`

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from './Login';

describe('Login Component', () => {
  test('renders email and password input fields', () => {
    render(<Login />);
    // Verifica si los campos de email y password están presentes
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  test('calls handleLogin on form submission with correct data', () => {
    const mockHandleLogin = jest.fn(); // Un mock para la función de login
    render(<Login handleLogin={mockHandleLogin} />); // Pasa el mock al componente

    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Login/i }); // Busca un botón con texto "Login"

    // Simula la entrada de usuario
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Simula el envío del formulario
    fireEvent.click(submitButton);

    // Verifica que la función mock se llamó con los argumentos correctos
    expect(mockHandleLogin).toHaveBeenCalledTimes(1);
    expect(mockHandleLogin).toHaveBeenCalledWith('test@example.com', 'password123');
  });
});