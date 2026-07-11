import { useMemo, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

export function PreviewTable({ data }: { data: Record<string, string>[] }) {
  const columns = useMemo<ColumnDef<Record<string, string>>[]>(() => {
    if (data.length === 0) return [];
    const keys = Object.keys(data[0]);
    return keys.map((key) => ({
      header: key,
      accessorKey: key,
    }));
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44, // roughly 44px per row
    overscan: 10,
  });

  if (data.length === 0) return null;

  return (
    <div 
      ref={parentRef}
      className="max-h-[600px] overflow-auto border border-gray-200 rounded-xl shadow-sm bg-white"
    >
      <table className="w-full text-sm text-left relative grid">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10 grid">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="flex">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-6 py-4 font-semibold flex-1 min-w-[150px] truncate border-b border-gray-200">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody 
          className="relative grid"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <tr 
                key={row.id} 
                className="flex absolute w-full hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                style={{
                  top: 0,
                  left: 0,
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-3 flex-1 min-w-[150px] truncate text-gray-600">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
