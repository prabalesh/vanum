import type { SeatType } from '../../types';

interface SeatTypeSelectorProps {
  seatTypes: Record<string, SeatType>;
  selectedTool: string;
  onToolSelect: (tool: string) => void;
}

export default function SeatTypeSelector({ 
  seatTypes, 
  selectedTool, 
  onToolSelect 
}: SeatTypeSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Seat Type
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Object.entries(seatTypes).map(([key, seatType]) => (
          <button
            key={key}
            onClick={() => onToolSelect(key)}
            className={`flex items-center p-3 rounded-md border transition-colors ${
              selectedTool === key
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
            title={seatType.description}
          >
            <div
              className="w-4 h-4 rounded mr-2 border flex items-center justify-center text-xs"
              style={{ backgroundColor: seatType.color }}
            >
              {seatType.icon}
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">{seatType.name}</div>
              {seatType.price > 0 && (
                <div className="text-xs text-gray-500">₹{seatType.price}</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
