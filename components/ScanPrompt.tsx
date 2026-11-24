'use client';

import React from 'react';
import { HardDrive, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DirectoryConfig } from '@/types';

interface ScanPromptProps {
  directory: DirectoryConfig | null;
  onStart: () => void;
}

/**
 * Shown when the app opens: nothing is scanned until the user asks for it,
 * because a scan of a multi-TB share can take minutes and wakes the disks.
 */
export default function ScanPrompt({ directory, onStart }: ScanPromptProps) {
  if (!directory) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Select a directory to start scanning</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in overflow-hidden">
      <CardContent className="flex flex-col items-center gap-5 p-12 text-center">
        <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-4">
          <HardDrive className="h-10 w-10 text-primary" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Ready to scan {directory.name}</h2>
          <p className="break-all font-mono text-sm text-muted-foreground">{directory.path}</p>
        </div>
        <Button size="lg" onClick={onStart} className="gap-2">
          <Play className="h-4 w-4" aria-hidden="true" />
          Start scan
        </Button>
        <p className="max-w-md text-xs text-muted-foreground">
          Large folders can take a few minutes. Scans are started only by you; scheduled
          history snapshots keep running on the server.
        </p>
      </CardContent>
    </Card>
  );
}
