import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, SwitchCamera } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          startScanning(scanner, devices[0].id);
        } else {
          setError('No cameras found');
        }
      })
      .catch((err) => {
        console.error('Camera error:', err);
        setError('Unable to access camera. Please allow camera permissions.');
      });

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async (scanner: Html5Qrcode, cameraId: string) => {
    try {
      setIsScanning(true);
      setError(null);

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Check if it matches order ID format (SL-XXXXXX)
          if (/^SL-[A-Z0-9]{6}$/.test(decodedText)) {
            scanner.stop().then(() => {
              onScan(decodedText);
            });
          }
        },
        () => {
          // Ignore scan failures (no QR found)
        }
      );
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Failed to start camera');
      setIsScanning(false);
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1 || !scannerRef.current) return;

    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);

    if (scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
    await startScanning(scannerRef.current, cameras[nextIndex].id);
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Scan Order QR Code</h3>
            </div>
            <div className="flex gap-2">
              {cameras.length > 1 && (
                <Button variant="ghost" size="icon" onClick={switchCamera}>
                  <SwitchCamera className="h-5 w-5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div
            id="qr-reader"
            className="w-full aspect-square bg-muted rounded-lg overflow-hidden"
          />

          {error && (
            <p className="text-sm text-destructive mt-4 text-center">{error}</p>
          )}

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Point your camera at an order QR code to scan it
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
