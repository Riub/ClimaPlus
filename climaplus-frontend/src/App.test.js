import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Prueba para verificar que un componente se renderiza con cierto texto
test('renders welcome message in App component', () => {
  render(<App />);
  const linkElement = screen.getByText(/Welcome to ClimaPlus/i); // Asumiendo que tu App tiene un texto de bienvenida
  expect(linkElement).toBeInTheDocument();
});
