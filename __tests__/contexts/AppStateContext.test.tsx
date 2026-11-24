import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AppStateProvider, useAppState } from '@/contexts/AppStateContext';

describe('AppStateContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppStateProvider>{children}</AppStateProvider>
  );

  it('provides default values', () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    expect(result.current.isDarkMode).toBe(true);
    expect(result.current.isSidebarOpen).toBe(false);
    expect(result.current.viewMode).toBe('treemap');
    expect(result.current.autoRefreshInterval).toBe(0);
  });

  it('starts dark on server and client, then follows a light system preference', () => {
    const original = window.matchMedia;
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })) as unknown as typeof window.matchMedia;
    try {
      const { result } = renderHook(() => useAppState(), { wrapper });
      // After mount the effect has applied the system preference (light)
      expect(result.current.isDarkMode).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    } finally {
      window.matchMedia = original;
    }
  });

  it('updates dark mode', () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    act(() => {
      result.current.setIsDarkMode(false);
    });

    expect(result.current.isDarkMode).toBe(false);
  });

  it('updates sidebar state', () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    act(() => {
      result.current.setIsSidebarOpen(true);
    });

    expect(result.current.isSidebarOpen).toBe(true);
  });

  it('updates view mode', () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    act(() => {
      result.current.setViewMode('tree');
    });

    expect(result.current.viewMode).toBe('tree');
  });

  it('updates auto-refresh interval', () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    act(() => {
      result.current.setAutoRefreshInterval(300000);
    });

    expect(result.current.autoRefreshInterval).toBe(300000);
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAppState());
    }).toThrow('useAppState must be used within an AppStateProvider');

    consoleSpy.mockRestore();
  });

  it('applies dark mode class to document', () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    // Initially dark mode is true
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Toggle to light mode
    act(() => {
      result.current.setIsDarkMode(false);
    });

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Toggle back to dark mode
    act(() => {
      result.current.setIsDarkMode(true);
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
