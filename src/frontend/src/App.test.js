import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }) => <pre>{children}</pre>,
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  atomDark: {},
}));

jest.mock('react-router-dom');
jest.mock('sql.js');

test('renders playground header and problem selector', () => {
  render(<App />);
  expect(screen.getByText(/Python Playground/i)).toBeInTheDocument();
  expect(screen.getByText(/SQL Playground/i)).toBeInTheDocument();
});
