import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';

test('renders login and allows switching to register form', () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  expect(screen.getByPlaceholderText('Enter your mobile number')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();

  // Switch to register form
  fireEvent.click(screen.getByText('New here? Create an account'));
  expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
});

