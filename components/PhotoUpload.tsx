'use client';
import { useRef } from 'react';

interface Props {
  previews: string[];      // local object URLs or remote URLs
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export default function PhotoUpload({ previews, onAdd, onRemove, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onAdd(files);
    e.target.value = '';
  }

  return (
    <div className="flex flex-wrap gap-3">
      {previews.map((src, i) => (
        <div key={`${src}-${i}`} className="relative w-24 h-24 rounded-xl overflow-hidden group">
          <img src={src} alt="" className="w-full h-full object-cover" />
          {!disabled && (
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute inset-0 bg-black/40 text-white text-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-24 h-24 rounded-xl border-2 border-dashed border-rose-200 flex flex-col items-center justify-center gap-1 text-brown-light hover:border-primary hover:text-primary transition-colors bg-rose-50"
        >
          <span className="text-2xl">📷</span>
          <span className="text-xs font-medium">Add photo</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  );
}
