import { describe, it, expect, beforeAll } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installMocks } from '@/mocks/install.js';
import { authService } from '@/services/authService.js';
import { controls } from '@/mocks/db.js';
import VehicleEntryPage from '@/features/vehicle-entry/pages/VehicleEntryPage.jsx';
import CheckoutPage from '@/features/vehicle-exit/pages/CheckoutPage.jsx';
import { renderApp } from './helpers.jsx';

const photo = () => new File([new Uint8Array(2000)], 'car.jpg', { type: 'image/jpeg' });
const upload = async (container) => userEvent.upload(container.querySelector('input[type=file]'), photo());

async function usePhoto(container) {
  await upload(container);
  await userEvent.click(await screen.findByRole('button', { name: /use this photo/i }));
  await screen.findByText(/^uploaded$/i, {}, { timeout: 4000 });
}

describe('UI lifecycle (entry wizard -> ticket -> checkout -> cash -> receipt)', () => {
  beforeAll(() => { installMocks(); });

  it('records a vehicle entry, shows the server ticket, then handles a slot conflict with the form preserved', async () => {
    await authService.login({ identifier: 'attendant@parkwise.demo', password: 'demo1234' });
    const { container } = renderApp(<VehicleEntryPage />, { route: '/entry' });

    // Step 1: validation, then details
    await screen.findByLabelText(/plate number/i);
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(await screen.findByText(/enter the plate number/i)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/plate number/i), 'rah 321 q');
    await userEvent.type(screen.getByLabelText(/customer phone/i), '0788111222');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2: only available car-compatible spaces are offered
    const group = await screen.findByRole('radiogroup', { name: /available spaces/i });
    const tiles = within(group).getAllByRole('button');
    expect(tiles.length).toBeGreaterThan(0);
    tiles.forEach((t) => expect(t.getAttribute('aria-label')).toMatch(/available/i));
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
    await userEvent.click(tiles[0]);
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 3: cannot continue until the photo is UPLOADED (captured is not enough)
    await screen.findByRole('button', { name: /choose or take photo/i });
    await upload(container);
    expect(await screen.findByText(/captured on this device only/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /use this photo/i }));
    await screen.findByText(/^uploaded$/i, {}, { timeout: 4000 });
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 4: slot conflict injected -> warning, back to space step, details kept
    await screen.findByText(/review and confirm/i);
    controls.forceSlotConflictNext = true;
    await userEvent.click(screen.getByRole('button', { name: /confirm vehicle entry/i }));
    expect(await screen.findByText(/this space was just taken/i)).toBeInTheDocument();
    await screen.findByRole('radiogroup', { name: /available spaces/i });
    // go back to verify the plate was preserved
    await userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByLabelText(/plate number/i)).toHaveValue('RAH 321 Q');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    const g2 = await screen.findByRole('radiogroup', { name: /available spaces/i });
    await userEvent.click(within(g2).getAllByRole('button')[0]);
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await userEvent.click(screen.getByRole('button', { name: /continue/i })); // photo preserved + uploaded
    await userEvent.click(await screen.findByRole('button', { name: /confirm vehicle entry/i }));

    // Success: server-issued ticket + entry recorded copy
    expect(await screen.findByText(/vehicle entry recorded/i, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getAllByText(/^PKG-\d{8}-\d{6}$/).length).toBeGreaterThan(0);
  }, 30000);

  it('checks a vehicle out, shows the SERVER fee, and completes with cash only after confirmation', async () => {
    controls.forceSlotConflictNext = false;
    await authService.login({ identifier: 'manager@parkwise.demo', password: 'demo1234' });
    // Use the seeded demo session
    const { sessionService } = await import('@/services/sessionService.js');
    const found = await sessionService.search({ q: 'PKG-DEMO-000123' });
    const id = found.items[0].id;

    const { container } = renderApp(<Routes><Route path="/exit/:sessionId" element={<CheckoutPage />} /></Routes>, { route: `/exit/${id}` });
    await screen.findByText('RAD 123 A');
    const go = screen.getByRole('button', { name: /record exit and calculate fee/i });
    expect(go).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox', { name: /correct vehicle/i }));
    await usePhoto(container);
    await userEvent.click(go);

    // Fee comes from the server: breakdown lines + amount due
    expect(await screen.findByText(/fee summary/i, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText(/amount due/i)).toBeInTheDocument();
    expect(screen.getByText(/first period/i)).toBeInTheDocument();

    // Cash: nothing is confirmed until the dialog is confirmed
    await userEvent.click(screen.getByRole('radio', { name: /cash/i }));
    expect(screen.queryByText(/payment confirmed/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /confirm cash received/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /confirm .* received/i }));
    expect(await screen.findByText(/payment confirmed\. receipt is ready/i, {}, { timeout: 4000 })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('link', { name: /view receipt/i })).toBeInTheDocument());
  }, 30000);
});
