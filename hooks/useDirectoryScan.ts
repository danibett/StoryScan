import { useState, useEffect, useCallback, useRef } from 'react';
import { DirectoryConfig, ScanResult } from '@/types';
import { createLogger } from '@/lib/logger';

interface UseDirectoryScanReturn {
  directories: DirectoryConfig[];
  selectedDirectory: DirectoryConfig | null;
  scanResult: ScanResult | null;
  isLoading: boolean;
  error: string | null;
  lastScanTime: Date | null;
  loadDirectories: () => Promise<void>;
  scanDirectory: (dir: DirectoryConfig) => Promise<void>;
  /** True once the user has started a scan in this session */
  hasScanned: boolean;
  /** Starts the scan of the selected directory (the app never scans on its own on open) */
  startScan: () => void;
  handleDirectorySelect: (dir: DirectoryConfig) => void;
  handleRefresh: () => void;
}

// Logger instance for directory scanning
const logger = createLogger('useDirectoryScan');

export function useDirectoryScan(autoRefreshInterval: number = 0): UseDirectoryScanReturn {
  const [directories, setDirectories] = useState<DirectoryConfig[]>([]);
  const [selectedDirectory, setSelectedDirectory] = useState<DirectoryConfig | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  // Opening the app only lists the directories: the first scan is started by the user.
  // After that, picking another directory scans it right away (that is a user action too).
  const [hasScanned, setHasScanned] = useState(false);
  const hasScannedRef = useRef(false);

  const loadDirectories = useCallback(async () => {
    logger.group('Loading directories...');
    logger.info('Request: GET /api/scan');

    try {
      const startTime = Date.now();
      const response = await fetch('/api/scan');
      const data = await response.json();
      const duration = Date.now() - startTime;

      logger.info(`✅ Directories loaded (${duration}ms)`);
      logger.info(`Found ${data.directories?.length ?? 0} directories`);

      if (data.directories) {
        setDirectories(data.directories);
        if (data.directories.length > 0) {
          logger.info(`Selected ${data.directories[0].name}, waiting for the user to start the scan`);
          setSelectedDirectory(data.directories[0]);
        }
      }
      logger.groupEnd();
    } catch (err) {
      logger.error('❌ Failed to load directories:', err);
      logger.groupEnd();
      setError('Failed to load directories');
    }
  }, []);

  const scanDirectory = useCallback(async (dir: DirectoryConfig) => {
    hasScannedRef.current = true;
    setHasScanned(true);
    logger.group('Scanning directory...');
    logger.info(`Directory: ${dir.name} (ID: ${dir.id})`);
    logger.info(`Path: ${dir.path}`);
    logger.info(`Request: GET /api/scan?dir=${dir.id}`);

    setIsLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const startTime = Date.now();
      const response = await fetch(`/api/scan?dir=${dir.id}`);

      if (!response.ok) {
        const errorData = await response.json();
        logger.error(`❌ HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
        logger.groupEnd();
        throw new Error('Failed to scan directory');
      }

      const data: ScanResult = await response.json();
      const duration = Date.now() - startTime;

      logger.info(`✅ Scan completed (${duration}ms)`);
      logger.info(`Total size: ${data.totalSize} bytes`);
      logger.info(`Root items: ${data.root?.children?.length ?? 0}`);
      logger.info(`Scanned at: ${data.scannedAt}`);
      logger.groupEnd();

      setScanResult(data);
      setLastScanTime(new Date());

      // Record history snapshots for tracked paths (fire-and-forget)
      fetch('/api/history/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directoryConfigId: dir.id, rootPath: dir.path, scanResult: data }),
      }).catch(() => {}); // Silent fail -- history recording should never block scans
    } catch (err) {
      logger.error('❌ Error scanning directory:', err);
      logger.groupEnd();
      setError('Failed to scan directory. Please check if the path is accessible.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDirectorySelect = useCallback(
    (dir: DirectoryConfig) => {
      logger.info(`👆 User selected directory: ${dir.name} (ID: ${dir.id})`);
      setSelectedDirectory(dir);
      if (hasScannedRef.current) {
        scanDirectory(dir);
      } else {
        // Nothing scanned yet: keep waiting for the user's "Start scan"
        setScanResult(null);
        setError(null);
      }
    },
    [scanDirectory]
  );

  const startScan = useCallback(() => {
    if (selectedDirectory) {
      logger.info(`▶️ User started scan for: ${selectedDirectory.name}`);
      scanDirectory(selectedDirectory);
    }
  }, [selectedDirectory, scanDirectory]);

  const handleRefresh = useCallback(() => {
    if (selectedDirectory) {
      logger.info(`🔄 Refreshing scan for: ${selectedDirectory.name}`);
      scanDirectory(selectedDirectory);
    }
  }, [selectedDirectory, scanDirectory]);

  // Load directories on mount
  useEffect(() => {
    loadDirectories();
  }, [loadDirectories]);

  // Auto-refresh effect
  useEffect(() => {
    // Auto-refresh only repeats a scan the user already started
    if (autoRefreshInterval === 0 || !selectedDirectory || !hasScanned) return;

    logger.info(`⏰ Auto-refresh enabled: ${autoRefreshInterval}ms interval`);

    const intervalId = setInterval(() => {
      logger.info(`⏰ Auto-refresh triggered for: ${selectedDirectory.name}`);
      scanDirectory(selectedDirectory);
    }, autoRefreshInterval);

    return () => {
      logger.info(`⏰ Auto-refresh disabled`);
      clearInterval(intervalId);
    };
  }, [autoRefreshInterval, selectedDirectory, hasScanned, scanDirectory]);

  return {
    directories,
    selectedDirectory,
    scanResult,
    isLoading,
    error,
    lastScanTime,
    loadDirectories,
    scanDirectory,
    hasScanned,
    startScan,
    handleDirectorySelect,
    handleRefresh,
  };
}
