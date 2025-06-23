// climaplus-frontend/src/App.test.js

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react'; 
import userEvent from '@testing-library/user-event'; 
import App from './App';


jest.mock('./components/Login', () => {

  return function MockLogin({ onLogin }) {

    return <div data-testid="login-component">Login Component Rendered</div>;
  };
});

jest.mock('./components/WeatherDashboard', () => {

  return function MockWeatherDashboard({ user }) {
    return <div data-testid="dashboard-component">Weather Dashboard Rendered for {user.email}</div>;
  };
});



describe('App Component', () => {

  test('renders Login component when no user is logged in', () => {
    render(<App />);

    expect(screen.getByTestId('login-component')).toBeInTheDocument();

    expect(screen.queryByTestId('dashboard-component')).toBeNull();
  });


  test('renders WeatherDashboard component when a user is logged in', async () => {

    render(<App />);

   
    const MockLoginComponent = require('./components/Login'); 
    
   
    const { rerender } = render(<App />);

    MockLoginComponent.mockImplementation(
      ({ onLogin }) => (
        <div data-testid="login-component">
          Login Component Rendered
          <button onClick={() => onLogin({ id: 1, email: 'mock@test.com', firstName: 'Mock', lastName: 'User' })}>Simular Login</button>
        </div>
      )
    );

   
    rerender(<App />);

    await userEvent.click(screen.getByText('Simular Login'));

 
    await waitFor(() => {
      expect(screen.queryByTestId('login-component')).toBeNull(); 
      expect(screen.getByTestId('dashboard-component')).toBeInTheDocument(); 
      expect(screen.getByText('Weather Dashboard Rendered for mock@test.com')).toBeInTheDocument();
    });
  });

});