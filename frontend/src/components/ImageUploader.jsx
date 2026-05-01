import { useRef, useState } from 'react';
import { UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';

/**
 * Drag-and-drop image uploader.
 * Calls onSubmit(file) when the user confirms.
 */
export default function ImageUploader({ onSubmit, busy = false, buttonLabel = 'Analyze food' }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = (f) => {
    setError(null);
    if (!f) return;
    if (!f.type.startsWith('image/')) { setError('Please choose an image file.'); return; }
    if (f.size > 10 * 1024 * 1024)    { setError('Image must be smaller than 10MB.'); return; }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const submit = () => {
    if (file && !busy) onSubmit?.(file);
  };

  return (
    <div className="space-y-4" data-testid="image-uploader">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e)=>{e.preventDefault(); setDragOver(true);}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={onDrop}
        className={`w-full rounded-3xl border-2 border-dashed px-6 py-12 text-left transition-colors
          ${dragOver ? 'border-leaf-600 bg-leaf-50' : 'border-leaf-200 bg-white hover:border-leaf-500'}`}
        data-testid="uploader-dropzone"
      >
        <div className="flex items-center gap-5">
          <span className="w-14 h-14 rounded-2xl bg-leaf-50 grid place-items-center text-leaf-700">
            {preview ? <ImageIcon size={24}/> : <UploadCloud size={24}/>}
          </span>
          <div className="flex-1">
            <p className="font-semibold text-ink-900">
              {file ? file.name : 'Drop a food label image here'}
            </p>
            <p className="text-sm text-neutral-500">
              or click to browse (JPG, PNG • max 10MB)
            </p>
          </div>
        </div>

        {preview && (
          <div className="mt-5 rounded-2xl overflow-hidden border border-leaf-100">
            <img src={preview} alt="preview" className="w-full max-h-80 object-contain bg-neutral-50" />
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
        data-testid="uploader-file-input"
      />

      {error && <p className="text-sm text-red-600" data-testid="uploader-error">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn-primary disabled:opacity-50"
          disabled={!file || busy}
          onClick={submit}
          data-testid="uploader-submit"
        >
          {busy ? <><Loader2 size={16} className="animate-spin"/> Analyzing…</> : buttonLabel}
        </button>
        {file && !busy && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => { setFile(null); setPreview(null); }}
            data-testid="uploader-clear"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}