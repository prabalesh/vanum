import { SEAT_TYPES } from '../../../constants/seatTypes';

export default function SeatTypesLegend() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold mb-3">Seat Types Legend</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {Object.entries(SEAT_TYPES).map(([key, seatType]) => (
          <div key={key} className="flex items-center">
            <div 
              className="w-4 h-4 rounded mr-2 border border-gray-300 flex items-center justify-center text-xs" 
              style={{ backgroundColor: seatType.color }}
            >
              {seatType.icon}
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-700">{seatType.name}</div>
              {seatType.price > 0 && (
                <div className="text-xs text-gray-500">₹{seatType.price}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700 space-y-1">
        <div><strong>🖱️ Single-click seats</strong> to change type using selected tool above.</div>
        <div><strong>🖱️ Double-click seats</strong> to set custom numbers.</div>
        <div><strong>🖱️ Click row labels (A, B, C)</strong> to select entire rows.</div>
        <div><strong>🖱️ Double-click row labels</strong> to instantly toggle entire row as walkway.</div>
        <div><strong>🔢 Smart Numbering:</strong> Seats in each row are numbered consecutively (A1, A2, A3) skipping walkways.</div>
        <div><strong>⚠️ Duplicate Detection:</strong> Seats with duplicate numbers are highlighted with red borders and warning icons.</div>
      </div>
    </div>
  );
}
