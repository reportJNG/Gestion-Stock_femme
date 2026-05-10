'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode, type CameraDevice } from 'html5-qrcode';
import { AlertCircle, CameraIcon, CameraOff, Loader2 } from 'lucide-react';

type ScannerStatus = 'loading' | 'active' | 'error' | 'permission-denied';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function BarcodeScanner({ onScan, onError, className }: BarcodeScannerProps) {
  const readerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const currentCameraRef = useRef('');
  const isMountedRef = useRef(false);
  const lastScanRef = useRef<string | null>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const initializedRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  const [status, setStatus] = useState<ScannerStatus>('loading');
  const [cameras, setCameras] = useState<CameraDevice[]>([]);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const setStatusIfMounted = useCallback((nextStatus: ScannerStatus) => {
    if (isMountedRef.current) setStatus(nextStatus);
  }, []);

  const setCurrentCameraIfMounted = useCallback((cameraId: string) => {
    currentCameraRef.current = cameraId;
  }, []);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;

    if (scanner) {
      try {
        if (scanner.isScanning) await scanner.stop();
      } catch {}

      try {
        scanner.clear();
      } catch {}
    }

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = undefined;
    }
  }, []);

  const getCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (!isMountedRef.current) return devices;

      setCameras(devices);
      if (devices.length > 0) setCurrentCameraIfMounted(devices[0].id);

      return devices;
    } catch {
      setStatusIfMounted('permission-denied');
      return [];
    }
  }, [setCurrentCameraIfMounted, setStatusIfMounted]);

  const startScanner = useCallback(
    async (cameraId?: string) => {
      if (!readerRef.current || !isMountedRef.current) return;

      try {
        if (scannerRef.current) await stopScanner();

        const scanner = new Html5Qrcode('scanner-reader');
        scannerRef.current = scanner;

        const targetCamera = cameraId || currentCameraRef.current;

        await scanner.start(
          targetCamera ? { deviceId: { exact: targetCamera } } : { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (width: number, height: number) => {
              const min = Math.min(width, height);
              const size = Math.floor(min * 0.7);
              return { width: size, height: size * 0.6 };
            },
            aspectRatio: 1.777,
          },
          (decodedText) => {
            if (lastScanRef.current === decodedText) return;

            lastScanRef.current = decodedText;
            if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);

            scanTimeoutRef.current = setTimeout(() => {
              lastScanRef.current = null;
            }, 2000);

            onScanRef.current(decodedText);
          },
          () => {}
        );

        if (!isMountedRef.current) {
          await stopScanner();
          return;
        }

        setStatusIfMounted('active');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Echec';
        setStatusIfMounted('error');
        onErrorRef.current?.(message);
      }
    },
    [setStatusIfMounted, stopScanner]
  );

  const switchCamera = useCallback(async () => {
    if (cameras.length < 2) return;

    const index = cameras.findIndex((camera) => camera.id === currentCameraRef.current);
    const nextCamera = cameras[(index + 1) % cameras.length];

    setCurrentCameraIfMounted(nextCamera.id);
    setStatusIfMounted('loading');
    await startScanner(nextCamera.id);
  }, [cameras, setCurrentCameraIfMounted, setStatusIfMounted, startScanner]);

  const retryScan = useCallback(async () => {
    setStatusIfMounted('loading');

    const devices = await getCameras();
    if (isMountedRef.current && devices.length > 0) {
      await startScanner(devices[0].id);
    }
  }, [getCameras, setStatusIfMounted, startScanner]);

  useEffect(() => {
    if (initializedRef.current) return;

    initializedRef.current = true;
    isMountedRef.current = true;
    let cancelled = false;

    const init = async () => {
      const devices = await getCameras();
      if (!cancelled && devices.length > 0) {
        await startScanner(devices[0].id);
      }
    };

    init();

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      stopScanner();
    };
  }, [getCameras, startScanner, stopScanner]);

  return (
    <div className={className}>
      <div className="relative rounded-2xl overflow-hidden bg-black/90 shadow-xl ring-1 ring-rose-soft/20">
        <div id="scanner-reader" ref={readerRef} className="aspect-[4/3] w-full" />

        {status === 'active' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[12.5%] left-[12.5%] right-[12.5%] bottom-[12.5%]">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/60 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/60 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/60 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/60 rounded-br-lg" />
            </div>
            <div className="absolute left-[14%] right-[14%] top-[50%] h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </div>
        )}

        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Demarrage camera...</p>
          </div>
        )}

        {status === 'permission-denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white p-6 gap-3">
            <CameraOff className="w-8 h-8 text-red-400" />
            <p className="text-sm font-medium">Acces camera refuse</p>
            <button
              onClick={retryScan}
              className="mt-2 px-4 py-2 text-xs bg-primary/20 hover:bg-primary/30 rounded-xl transition-colors"
            >
              Reessayer
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white p-6 gap-3">
            <AlertCircle className="w-8 h-8 text-amber-400" />
            <p className="text-sm font-medium">Erreur camera</p>
            <button
              onClick={retryScan}
              className="mt-2 px-4 py-2 text-xs bg-primary/20 hover:bg-primary/30 rounded-xl transition-colors"
            >
              Reessayer
            </button>
          </div>
        )}
      </div>

      {status === 'active' && (
        <div className="mt-3 flex items-center justify-between px-4 py-2 bg-white/70 backdrop-blur-sm rounded-xl border border-rose-soft/20 shadow-sm text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Scanner actif
          </div>
          {cameras.length > 1 && (
            <button onClick={switchCamera} className="flex items-center gap-1 text-primary hover:underline">
              <CameraIcon className="w-3.5 h-3.5" />
              Changer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
