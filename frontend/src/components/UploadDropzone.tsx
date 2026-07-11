import { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function UploadDropzone({ onUpload }: { onUpload: (file: File) => void }) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          onUpload(file);
        } else {
          alert('Please upload a valid CSV file.');
        }
      }
    },
    [onUpload]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        'border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[300px] bg-white',
        isDragActive
          ? 'border-blue-500 bg-blue-50 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-[1.02]'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      )}
    >
      <div className={cn(
        "p-4 rounded-full mb-4 transition-colors",
        isDragActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
      )}>
        <UploadCloud className="w-10 h-10" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {isDragActive ? 'Drop your CSV here...' : 'Click or drag CSV here'}
      </h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        Upload Facebook Leads, Google Ads exports, or manual spreadsheets. Our AI handles any header format.
      </p>
      
      <label className="relative">
        <input
          type="file"
          accept=".csv"
          onChange={handleChange}
          className="sr-only"
        />
        <span className="px-6 py-2.5 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm cursor-pointer">
          Select File
        </span>
      </label>
    </div>
  );
}
