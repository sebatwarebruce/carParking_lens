import { describe, it, expect, beforeAll } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installMocks } from '@/mocks/install.js';
import LoginPage from '@/features/auth/pages/LoginPage.jsx';
import { renderApp } from './helpers.jsx';

describe('Login', () => {
  beforeAll(() => { installMocks(); });

  it('shows social sign-in first, disabled until the backend enables a provider, with password fallback', async () => {
    renderApp(<LoginPage />, { route: '/login' });
    const google = await screen.findByRole('button', { name: /continue with google/i });
    expect(google).toBeDisabled();
    expect(screen.getByLabelText(/email or phone/i)).toBeInTheDocument();
    const order = [google, screen.getByRole('button', { name: /^sign in$/i })];
    expect(order[0].compareDocumentPosition(order[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('validates required fields before calling the server', async () => {
    renderApp(<LoginPage />, { route: '/login' });
    await userEvent.click(await screen.findByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByText(/enter your email or phone/i)).toBeInTheDocument();
  });

  it('shows a clear message for invalid credentials and for disabled accounts', async () => {
    renderApp(<LoginPage />, { route: '/login' });
    await userEvent.type(await screen.findByLabelText(/email or phone/i), 'attendant@parkwise.demo');
    await userEvent.type(screen.getByLabelText(/^password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByText(/email\/phone or password is incorrect/i)).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText(/email or phone/i));
    await userEvent.type(screen.getByLabelText(/email or phone/i), 'disabled@parkwise.demo');
    await userEvent.clear(screen.getByLabelText(/^password/i));
    await userEvent.type(screen.getByLabelText(/^password/i), 'demo1234');
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => expect(screen.getByText(/account disabled/i)).toBeInTheDocument());
  });
});
