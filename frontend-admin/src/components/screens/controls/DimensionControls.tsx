import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { GRID_LIMITS } from '../../../constants/seatTypes';

interface DimensionControlsProps {
  rows: number;
  columns: number;
  onUpdateDimensions: (rows: number, columns: number) => void;
}

export default function DimensionControls({ 
  rows, 
  columns, 
  onUpdateDimensions 
}: DimensionControlsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rows</label>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => onUpdateDimensions(rows - 1, columns)} 
            className="p-1 border border-gray-300 rounded hover:bg-gray-50"
            disabled={rows <= GRID_LIMITS.MIN_ROWS}
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <span className="w-12 text-center">{rows}</span>
          <button 
            onClick={() => onUpdateDimensions(rows + 1, columns)} 
            className="p-1 border border-gray-300 rounded hover:bg-gray-50"
            disabled={rows >= GRID_LIMITS.MAX_ROWS}
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => onUpdateDimensions(rows, columns - 1)} 
            className="p-1 border border-gray-300 rounded hover:bg-gray-50"
            disabled={columns <= GRID_LIMITS.MIN_COLUMNS}
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <span className="w-12 text-center">{columns}</span>
          <button 
            onClick={() => onUpdateDimensions(rows, columns + 1)} 
            className="p-1 border border-gray-300 rounded hover:bg-gray-50"
            disabled={columns >= GRID_LIMITS.MAX_COLUMNS}
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
