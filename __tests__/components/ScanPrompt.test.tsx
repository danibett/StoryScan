import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ScanPrompt from '@/components/ScanPrompt';

describe('ScanPrompt', () => {
  const directory = { id: '0', name: 'media', path: '/data/media' };

  it('asks to pick a directory when none is selected', () => {
    render(<ScanPrompt directory={null} onStart={jest.fn()} />);
    expect(screen.getByText('Select a directory to start scanning')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /start scan/i })).not.toBeInTheDocument();
  });

  it('shows the selected directory and its path', () => {
    render(<ScanPrompt directory={directory} onStart={jest.fn()} />);
    expect(screen.getByText('Ready to scan media')).toBeInTheDocument();
    expect(screen.getByText('/data/media')).toBeInTheDocument();
  });

  it('starts the scan only when the button is clicked', () => {
    const onStart = jest.fn();
    render(<ScanPrompt directory={directory} onStart={onStart} />);
    expect(onStart).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /start scan/i }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
