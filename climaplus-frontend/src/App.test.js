import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import Login from './components/Login';
import WeatherDashboard from './components/WeatherDashboard';

jest.mock('./components/Login', () => {
  return jest.fn((props) => (
    <div data-testid="mock-login">
      Mock Login Component
      <button onClick={() => props.onLogin({ username: 'testUser' })}>Mock Login Button</button>
    </div>
  ));
});

jest.mock('./components/WeatherDashboard', () => {
  return jest.fn(() => <div data-testid="mock-weather-dashboard">Mock Weather Dashboard Component</div>);
});

describe('App Component', () => {
  test('renderiza el componente Login cuando no hay usuario', () => {
    render(<App />);

    const loginComponent = screen.getByTestId('mock-login');
    expect(loginComponent).toBeInTheDocument();

    const weatherDashboardComponent = screen.queryByTestId('mock-weather-dashboard');
    expect(weatherDashboardComponent).not.toBeInTheDocument();
  });
});