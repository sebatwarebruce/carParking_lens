import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CameraCapture from '@/components/common/CameraCapture.jsx';
import NetworkProvider from '@/app/providers/NetworkProvider.jsx';

const mount = (props = {}) => render(<NetworkProvider><CameraCapture captureType="ENTRY" lotId="l1" value={null} onChange={() => {}} {...props} /></NetworkProvider>);
afterEach(() => { vi.restoreAllMocks(); });

describe('CameraCapture fallbacks', () => {
  it('permission denied shows recovery guidance and keeps the file picker available', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'NotAllowedError' })) }, configurable: true });
    mount();
    await userEvent.click(screen.getByRole('button', { name: /open camera/i }));
    expect(await screen.findByText(/camera access is blocked/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose or take photo/i })).toBeEnabled();
  });

  it('no camera API shows the unavailable state', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });
    mount();
    await userEvent.click(screen.getByRole('button', { name: /open camera/i }));
    expect(await screen.findByText(/no camera is available/i)).toBeInTheDocument();
  });

  it('a captured photo is "on this device only" until upload completes, and can be retaken', () => {
    const value = { file: new File(['x'], 'p.jpg', { type: 'image/jpeg' }), previewUrl: 'blob:x', capturedAt: new Date().toISOString(), ref: null };
    mount({ value });
    expect(screen.getByText(/captured on this device only/i)).toBeInTheDocument();
    expect(screen.queryByText(/^uploaded$/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retake/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /use this photo/i })).toBeEnabled();
  });

  it('an uploaded photo shows the Uploaded state', () => {
    const value = { file: new File(['x'], 'p.jpg', { type: 'image/jpeg' }), previewUrl: 'blob:x', capturedAt: new Date().toISOString(), ref: { key: 'k', url: '/u' } };
    mount({ value });
    expect(screen.getByText(/^uploaded$/i)).toBeInTheDocument();
  });
});
