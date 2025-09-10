import { CogIcon } from '@heroicons/react/24/outline';

interface LayoutSettingsProps {
  showSettings: boolean;
  onToggleSettings: () => void;
  numberingScheme: string;
  onNumberingSchemeChange: (scheme: string) => void;
  rowNaming: string;
  onRowNamingChange: (naming: string) => void;
  customRowNames: string[];
  onCustomRowNameChange: (index: number, value: string) => void;
  actualRowCount: number;
  onApplyChanges: () => void;
}

export default function LayoutSettings({
  showSettings,
  onToggleSettings,
  numberingScheme,
  onNumberingSchemeChange,
  rowNaming,
  onRowNamingChange,
  customRowNames,
  onCustomRowNameChange,
  actualRowCount,
  onApplyChanges
}: LayoutSettingsProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Layout Configuration</h3>
        <button
          onClick={onToggleSettings}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
        >
          <CogIcon className="h-5 w-5" />
        </button>
      </div>

      {showSettings && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          {/* Numbering Scheme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seat Numbering Scheme
            </label>
            <select
              value={numberingScheme}
              onChange={(e) => onNumberingSchemeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="alphabetic">Row-wise: A1, A2, B1, B2</option>
              <option value="numeric">Numeric: 1-1, 1-2, 2-1, 2-2</option>
              <option value="custom">Custom Row Names + Numbers</option>
            </select>
          </div>

          {/* Row Naming */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Row Naming Convention
            </label>
            <select
              value={rowNaming}
              onChange={(e) => onRowNamingChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="alphabetic">Alphabetic (A, B, C) - skips walkway rows</option>
              <option value="numeric">Numeric (1, 2, 3) - skips walkway rows</option>
              <option value="custom">Custom Names (VIP, Gold, etc.)</option>
            </select>
          </div>

          {/* Custom Row Names */}
          {rowNaming === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Row Names (only for rows with seats)
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {Array.from({ length: actualRowCount || 5 }, (_, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder={`Row ${index + 1}`}
                    value={customRowNames[index] || ''}
                    onChange={(e) => onCustomRowNameChange(index, e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  />
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onApplyChanges}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply Numbering Changes
          </button>
        </div>
      )}
    </>
  );
}
