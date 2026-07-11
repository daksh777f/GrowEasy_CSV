import { CheckCircle2, XCircle } from 'lucide-react';
import { PreviewTable } from './PreviewTable';

export function ResultsView({ results, onReset }: { results: any, onReset: () => void }) {
  const { importedCount, skippedCount, imported, skipped } = results;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-full">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Successfully Imported</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{importedCount}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-500 rounded-full">
            <XCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Skipped Records</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{skippedCount}</h3>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={onReset}
          className="px-6 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
        >
          Import Another File
        </button>
      </div>

      {importedCount > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold">Imported Records</h3>
          {/* We reuse the PreviewTable logic for display, just flatten the objects to string for display */}
          <PreviewTable data={imported.map((r: any) => {
            const row: Record<string, string> = {};
            for (const [k, v] of Object.entries(r)) {
              row[k] = String(v ?? '');
            }
            return row;
          })} />
        </div>
      )}

      {skippedCount > 0 && (
        <div className="space-y-3 mt-8">
          <h3 className="text-lg font-bold text-red-600">Skipped Records</h3>
          <p className="text-sm text-gray-500">These rows failed validation rules (e.g. missing both email and phone).</p>
          <PreviewTable data={skipped.map((s: any) => ({
            OriginalRow: String(s.originalRow),
            Reason: s.reason,
            Data: JSON.stringify(s.data)
          }))} />
        </div>
      )}
    </div>
  );
}
