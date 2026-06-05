import { useState, useRef, useCallback } from 'react';

export default function ImageUpload({ onFileSelected, disabled = false }) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setPreview(URL.createObjectURL(file));
    onFileSelected(file);
  }, [onFileSelected]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleChange = useCallback((e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-4">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-10 sm:p-14
          flex flex-col items-center justify-center text-center
          transition-all duration-200 cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${dragOver
            ? 'border-accent bg-accent/5 scale-[1.01]'
            : 'border-border hover:border-border-light'
          }
        `}
      >
        {preview ? (
          <img
            src={preview}
            alt="Upload preview"
            className="max-h-48 rounded-md object-contain mb-4"
          />
        ) : (
          <svg className="w-10 h-10 text-text-muted mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        )}
        <p className="text-sm text-text-muted mb-1">
          {preview ? 'Click or drop to change image' : 'Drag and drop an image, or click to browse'}
        </p>
        <p className="text-xs text-text-muted">
          JPG, PNG up to 10 MB — inference takes ~200 ms
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
