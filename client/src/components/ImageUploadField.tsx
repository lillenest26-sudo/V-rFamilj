import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Upload, Link as LinkIcon, X, Camera as CameraIcon } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface ImageUploadFieldProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUploadField({ value, onChange, label }: ImageUploadFieldProps) {
  const [mode, setMode] = useState<'device' | 'camera' | 'url' | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [preview, setPreview] = useState<string | null>(value || null);
  const [loading, setLoading] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreview(dataUrl);
      onChange(dataUrl);
      setMode(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async () => {
    if (!isNative) {
      alert('Camera is only available on native Android/iOS apps');
      return;
    }

    setLoading(true);
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        setPreview(image.dataUrl);
        onChange(image.dataUrl);
        setMode(null);
      }
    } catch (error) {
      console.error('Camera error:', error);
      if ((error as any).message !== 'User cancelled photos app') {
        alert('Failed to capture photo');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGallerySelect = async () => {
    if (!isNative) {
      // Fallback to file input on web
      setMode('device');
      return;
    }

    setLoading(true);
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (image.dataUrl) {
        setPreview(image.dataUrl);
        onChange(image.dataUrl);
        setMode(null);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      if ((error as any).message !== 'User cancelled photos app') {
        alert('Failed to select photo');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      setPreview(urlInput);
      onChange(urlInput);
      setMode(null);
      setUrlInput('');
    }
  };

  const handleClear = () => {
    setPreview(null);
    onChange('');
    setMode(null);
  };

  return (
    <div className="space-y-3">
      {label && <label className="text-sm font-medium">{label}</label>}

      {preview ? (
        <div className="relative">
          <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {!mode ? (
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleGallerySelect}
                disabled={loading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Ladda upp
              </Button>
              {isNative && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleCameraCapture}
                  disabled={loading}
                >
                  <CameraIcon className="w-4 h-4 mr-2" />
                  Kamera
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setMode('url')}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Bildlänk
              </Button>
            </div>
          ) : mode === 'device' ? (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMode(null)}
                className="mt-2"
              >
                Avbryt
              </Button>
            </div>
          ) : mode === 'url' ? (
            <div className="space-y-2">
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUrlSubmit}
                >
                  Lägg till
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode(null)}
                >
                  Avbryt
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
