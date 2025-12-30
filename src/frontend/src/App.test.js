import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }) => <pre>{children}</pre>,
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  atomDark: {},
}));

test('renders playground header and problem selector', () => {
  render(<App />);
  expect(screen.getByText(/Python sandbox/i)).toBeInTheDocument();
  expect(screen.getByText(/Choose a challenge/i)).toBeInTheDocument();
});
