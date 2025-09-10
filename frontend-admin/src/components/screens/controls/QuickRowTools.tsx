interface QuickRowToolsProps {
  selectedRowCount: number;
  onMakeWalkways: () => void;
  onClearSelection: () => void;
}

export default function QuickRowTools({ 
  selectedRowCount, 
  onMakeWalkways, 
  onClearSelection 
}: QuickRowToolsProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-2 text-blue-900">Quick Row Tools</h3>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onMakeWalkways}
          disabled={selectedRowCount === 0}
          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Make Selected Rows Walkways ({selectedRowCount})
        </button>
        
        <button
          onClick={onClearSelection}
          disabled={selectedRowCount === 0}
          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear Selection
        </button>
      </div>
      <p className="text-xs text-blue-700 mt-2">
        💡 <strong>Tip:</strong> Click on row labels (A, B, C) to select/toggle entire rows as walkways
      </p>
    </div>
  );
}
