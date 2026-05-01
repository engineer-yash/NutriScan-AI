import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeFood } from '../services/api.js';
import ImageUploader from '../components/ImageUploader.jsx';
import CameraScanner from '../components/CameraScanner.jsx';
import { ScanLine, Upload, Camera } from 'lucide-react';

export default function Analyze() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('upload'); // 'upload' | 'camera'

  const run = async (fileOrBlob, filename) => {
    setError(null);
    setBusy(true);
    try {
      const result = await analyzeFood(fileOrBlob, filename);
      sessionStorage.setItem('lastScan', JSON.stringify(result));
      navigate(`/result/${result.id}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onUploadSubmit = (file) => run(file);
  const onCameraCapture = (blob) => run(blob, `capture-${Date.now()}.jpg`);

  return (
    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
      <div className="space-y-3 animate-fade-up">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-leaf-50 text-leaf-700 text-sm font-semibold">
          <ScanLine size={14}/> Scan a food label
        </span>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold">Scan your food</h1>
        <p className="text-neutral-600 text-sm sm:text-base">
          Use your camera for a real-time scan or upload an image. We&apos;ll read the label with Azure Vision,
          detect any expiry date, and analyze ingredients with Azure OpenAI.
        </p>
      </div>

      {/* Mode toggle */}
      <div
        className="grid grid-cols-2 gap-2 p-1 rounded-full bg-white border border-leaf-100 shadow-sm"
        role="tablist"
        data-testid="analyze-mode-toggle"
      >
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-colors ${
            mode === 'upload' ? 'bg-leaf-600 text-white shadow' : 'text-ink-900 hover:bg-leaf-50'
          }`}
          data-testid="mode-upload-btn"
          aria-selected={mode === 'upload'}
          role="tab"
        >
          <Upload size={16}/> Upload
        </button>
        <button
          type="button"
          onClick={() => setMode('camera')}
          className={`flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-colors ${
            mode === 'camera' ? 'bg-leaf-600 text-white shadow' : 'text-ink-900 hover:bg-leaf-50'
          }`}
          data-testid="mode-camera-btn"
          aria-selected={mode === 'camera'}
          role="tab"
        >
          <Camera size={16}/> Use camera
        </button>
      </div>

      <div className="card p-4 sm:p-6">
        {mode === 'upload' ? (
          <ImageUploader onSubmit={onUploadSubmit} busy={busy} buttonLabel="Analyze food label" />
        ) : (
          <CameraScanner onCapture={onCameraCapture} busy={busy} buttonLabel="Analyze food label" />
        )}
        {error && <p className="mt-4 text-sm text-red-600" data-testid="analyze-error">{error}</p>}
      </div>

      <div className="text-xs text-neutral-500 text-center px-4">
        Tip: a well-lit, flat shot of the ingredients and the best-before date gives the best results.
      </div>
    </div>
  );
}