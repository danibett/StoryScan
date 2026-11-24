import { renderHook, act, waitFor } from '@testing-library/react';
import { useDirectoryScan } from '@/hooks/useDirectoryScan';

global.fetch = jest.fn();

describe('useDirectoryScan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Also drop queued mockResolvedValueOnce values a test did not consume
    (global.fetch as jest.Mock).mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const mockDirectories = [
    { id: '0', name: 'test-dir', path: '/test/path' },
    { id: '1', name: 'another-dir', path: '/another/path' },
  ];

  const mockScanResult = {
    directory: mockDirectories[0],
    root: {
      name: 'test-dir',
      path: '/test/path',
      size: 1000,
      type: 'directory' as const,
      children: [],
    },
    totalSize: 1000,
    scannedAt: new Date().toISOString(),
  };

  it('loads directories on mount', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ directories: mockDirectories }),
      });

    const { result } = renderHook(() => useDirectoryScan());

    await waitFor(() => {
      expect(result.current.directories).toEqual(mockDirectories);
      expect(result.current.selectedDirectory).toEqual(mockDirectories[0]);
    });
  });

  it('does not scan on open: the first scan is started by the user', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ directories: mockDirectories }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => mockScanResult,
      });

    const { result } = renderHook(() => useDirectoryScan(5000));

    await waitFor(() => {
      expect(result.current.selectedDirectory).toEqual(mockDirectories[0]);
    });
    // Auto-refresh is on, but nothing was started yet: still no scan
    act(() => {
      jest.advanceTimersByTime(15000);
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalledWith('/api/scan?dir=0');
    expect(result.current.scanResult).toBeNull();
    expect(result.current.hasScanned).toBe(false);

    act(() => {
      result.current.startScan();
    });

    await waitFor(() => {
      expect(result.current.scanResult).toEqual(mockScanResult);
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/scan?dir=0');
    expect(result.current.hasScanned).toBe(true);
  });

  it('selecting a directory before the first scan does not scan it', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ directories: mockDirectories }),
    });

    const { result } = renderHook(() => useDirectoryScan());

    await waitFor(() => {
      expect(result.current.selectedDirectory).toEqual(mockDirectories[0]);
    });

    act(() => {
      result.current.handleDirectorySelect(mockDirectories[1]);
    });

    expect(result.current.selectedDirectory).toEqual(mockDirectories[1]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('scans directory on selection', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ directories: mockDirectories }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockScanResult,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockScanResult,
      });

    const { result } = renderHook(() => useDirectoryScan());

    await waitFor(() => {
      expect(result.current.selectedDirectory).toBeTruthy();
    });

    act(() => {
      result.current.startScan();
    });

    await waitFor(() => {
      expect(result.current.scanResult).toBeTruthy();
    });

    act(() => {
      result.current.handleDirectorySelect(mockDirectories[1]);
    });

    await waitFor(() => {
      expect(result.current.selectedDirectory).toEqual(mockDirectories[1]);
    });
    // After the first scan, picking another directory scans it right away
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/scan?dir=1');
    });
  });

  it('handles refresh', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ directories: mockDirectories }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => mockScanResult,
      });

    const { result } = renderHook(() => useDirectoryScan());

    await waitFor(() => {
      expect(result.current.selectedDirectory).toBeTruthy();
    });

    act(() => {
      result.current.startScan();
    });

    await waitFor(() => {
      expect(result.current.scanResult).toBeTruthy();
    });

    act(() => {
      result.current.handleRefresh();
    });

    // Calls: 1 load dirs + 1 initial scan + 1 history record + 1 refresh scan + 1 history record = 5
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(5);
    });
  });

  it('handles auto-refresh interval', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ directories: mockDirectories }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => mockScanResult,
      });

    const { result } = renderHook(() => useDirectoryScan(5000));

    await waitFor(() => {
      expect(result.current.selectedDirectory).toBeTruthy();
    });

    act(() => {
      result.current.startScan();
    });

    await waitFor(() => {
      expect(result.current.scanResult).toBeTruthy();
    });
    const scanCalls = () =>
      (global.fetch as jest.Mock).mock.calls.filter(([url]) => url === '/api/scan?dir=0').length;
    expect(scanCalls()).toBe(1);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(scanCalls()).toBe(2);
    });
  });

  it('handles scan errors', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ directories: mockDirectories }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'boom' }),
      });

    const { result } = renderHook(() => useDirectoryScan());

    await waitFor(() => {
      expect(result.current.selectedDirectory).toBeTruthy();
    });

    act(() => {
      result.current.startScan();
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('sets loading state during scan', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ directories: mockDirectories }),
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => mockScanResult,
                }),
              100
            )
          )
      );

    const { result } = renderHook(() => useDirectoryScan());

    await waitFor(() => {
      expect(result.current.selectedDirectory).toBeTruthy();
    });

    act(() => {
      result.current.startScan();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
