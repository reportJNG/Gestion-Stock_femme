'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { CameraOff, CameraIcon, AlertCircle, Loader2 } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function BarcodeScanner({ onScan, onError, className }: BarcodeScannerProps) {
  const readerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [status, setStatus] = useState<'loading' | 'active' | 'error' | 'permission-denied'>('loading');
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [currentCamera, setCurrentCamera] = useState<string>('');

  // ✅ Use refs for dedup — no stale closure issue
  const lastScanRef = useRef<string | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout>();
  const initializedRef = useRef(false);

  // ✅ Keep latest onScan in a ref so the scanner callback never goes stale
  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  const getCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      if (devices.length > 0) setCurrentCamera(devices[0].id);
      return devices;
    } catch {
      setStatus('permission-denied');
      return [];
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch {}
    }
    scannerRef.current = null;
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
  }, []);

  const startScanner = useCallback(async (cameraId?: string) => {
    if (!readerRef.current) return;
    try {
      if (scannerRef.current) await stopScanner();
      const scanner = new Html5Qrcode('scanner-reader');
      scannerRef.current = scanner;
      const targetCamera = cameraId || currentCamera;
      await scanner.start(
        targetCamera ? { deviceId: { exact: targetCamera } } : { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (w: number, h: number) => {
            const min = Math.min(w, h);
            const s = Math.floor(min * 0.7);
            return { width: s, height: s * 0.6 };
          },
          aspectRatio: 1.777,
        },
        (decodedText) => {
          // ✅ Dedup via ref — always fresh, no stale closure
          if (lastScanRef.current === decodedText) return;
          lastScanRef.current = decodedText;
          if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
          scanTimeoutRef.current = setTimeout(() => { lastScanRef.current = null; }, 2000);
          // ✅ Call via ref — always latest onScan, no toast here (page.tsx handles it)
          onScanRef.current(decodedText);
        },
        () => {}
      );
      setStatus('active');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Échec';
      setStatus('error');
      onError?.(message);
    }
  }, [currentCamera, onError, stopScanner]);

  const switchCamera = useCallback(async () => {
    if (cameras.length < 2) return;
    const idx = cameras.findIndex(c => c.id === currentCamera);
    const next = cameras[(idx + 1) % cameras.length];
    setCurrentCamera(next.id);
    setStatus('loading');
    await startScanner(next.id);
  }, [cameras, currentCamera, startScanner]);

  const retryScan = useCallback(async () => {
    setStatus('loading');
    const devices = await getCameras();
    if (devices.length > 0) await startScanner(devices[0].id);
  }, [getCameras, startScanner]);

  // ✅ Run once via ref flag — no missing deps warning, no restart loop
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const init = async () => {
      const devices = await getCameras();
      if (devices.length > 0) await startScanner(devices[0].id);
    };
    init();
    return () => { stopScanner(); };
  }, [getCameras, startScanner, stopScanner]);

  return (
    <div className={className}>
      <div className="relative rounded-2xl overflow-hidden bg-black/90 shadow-xl ring-1 ring-rose-soft/20">
        <div id="scanner-reader" ref={readerRef} className="aspect-[4/3] w-full" />

        {/* scan guide */}
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
            <p className="text-sm">Démarrage caméra...</p>
          </div>
        )}
        {status === 'permission-denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white p-6 gap-3">
            <CameraOff className="w-8 h-8 text-red-400" />
            <p className="text-sm font-medium">Accès caméra refusé</p>
            <button onClick={retryScan} className="mt-2 px-4 py-2 text-xs bg-primary/20 hover:bg-primary/30 rounded-xl transition-colors">
              Réessayer
            </button>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white p-6 gap-3">
            <AlertCircle className="w-8 h-8 text-amber-400" />
            <p className="text-sm font-medium">Erreur caméra</p>
            <button onClick={retryScan} className="mt-2 px-4 py-2 text-xs bg-primary/20 hover:bg-primary/30 rounded-xl transition-colors">
              Réessayer
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