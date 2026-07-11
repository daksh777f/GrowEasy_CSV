'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { UploadDropzone } from '@/components/UploadDropzone';
import { PreviewTable } from '@/components/PreviewTable';
import { ResultsView } from '@/components/ResultsView';

export type AppState = 'upload' | 'preview' | 'processing' | 'results';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
  const [results, setResults] = useState<{ imported: any[]; skipped: any[]; importedCount: number; skippedCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    setError(null);
    setProgress(null);
    
    // Client-side CSV parsing for preview
    Papa.parse<Record<string, string>>(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Failed to parse CSV file.');
          return;
        }
        setPreviewData(results.data);
        setAppState('preview');
      },
      error: (err) => {
        setError(err.message);
      }
    });
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    
    setAppState('processing');
    setError(null);
    setProgress(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3001/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Server error occurred');
      }

      const jobId = json.jobId;

      const eventSource = new EventSource(`http://localhost:3001/api/progress/${jobId}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Progress update:', data);
        
        setProgress({ processed: data.processedCount, total: data.totalCount });

        if (data.status === 'complete') {
          eventSource.close();
          setResults(data.result);
          setAppState('results');
        } else if (data.status === 'error') {
          eventSource.close();
          setError(data.error || 'An error occurred during processing');
          setAppState('preview');
        }
      };

      eventSource.onerror = (err) => {
        eventSource.close();
        console.error('SSE Error:', err);
        setError('Lost connection to server during processing.');
        setAppState('preview');
      };

    } catch (err: any) {
      setError(err.message);
      setAppState('preview'); // go back to preview to retry
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
    setResults(null);
    setError(null);
    setProgress(null);
    setAppState('upload');
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">GrowEasy AI CSV Importer</h1>
          <p className="text-gray-500">Upload your raw leads and let AI structure them for your CRM.</p>
        </header>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {appState === 'upload' && (
          <UploadDropzone onUpload={handleFileUpload} />
        )}

        {appState === 'preview' && previewData.length > 0 && (
          <div className="space-y-4 fade-in">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div>
                <h2 className="text-xl font-bold">Data Preview</h2>
                <p className="text-sm text-gray-500">{previewData.length} rows detected in {file?.name}</p>
              </div>
              <div className="space-x-3">
                <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmImport}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
                >
                  Confirm Import
                </button>
              </div>
            </div>
            
            <PreviewTable data={previewData} />
          </div>
        )}

        {appState === 'processing' && (
          <div className="flex flex-col items-center justify-center py-24 space-y-6 fade-in">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <div className="text-center space-y-2 w-full max-w-md">
              <h3 className="text-lg font-semibold">Processing your data...</h3>
              <p className="text-sm text-gray-500">Our AI is mapping fields and extracting insights.</p>
              {progress && progress.total > 0 && (
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.round((progress.processed / progress.total) * 100)}%` }}
                  ></div>
                  <p className="text-xs text-gray-400 mt-2 text-right">
                    {progress.processed} / {progress.total} rows
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {appState === 'results' && results && (
          <div className="fade-in">
            <ResultsView results={results} onReset={handleReset} />
          </div>
        )}
      </div>
    </main>
  );
}
