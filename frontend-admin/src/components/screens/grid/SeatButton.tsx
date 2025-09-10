import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { SeatPosition } from '../../../types';
import { isSeat } from '../../../utils/seatNumbering';
import { SEAT_TYPES } from '../../../constants/seatTypes';

interface SeatButtonProps {
  seat: SeatPosition;
  rowIndex: number;
  colIndex: number;
  isDuplicate: boolean;
  onClick: (rowIndex: number, colIndex: number) => void;
  onDoubleClick: (rowIndex: number, colIndex: number) => void;
}

export default function SeatButton({
  seat,
  rowIndex,
  colIndex,
  isDuplicate,
  onClick,
  onDoubleClick
}: SeatButtonProps) {
  return (
    <div className="relative">
      <button
        onClick={() => onClick(rowIndex, colIndex)}
        onDoubleClick={() => onDoubleClick(rowIndex, colIndex)}
        className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 text-xs font-medium flex items-center justify-center ${
          isSeat(seat.type)
            ? `border-gray-300 cursor-pointer hover:border-gray-400 ${isDuplicate ? 'ring-2 ring-red-400 border-red-400' : ''}`
            : 'border-gray-200 cursor-pointer bg-gray-100'
        }`}
        style={{
          backgroundColor: isDuplicate ? '#FEE2E2' : (SEAT_TYPES[seat.type]?.color || '#10B981'),
          color: isSeat(seat.type) ? (isDuplicate ? '#DC2626' : 'white') : '#6B7280',
          opacity: seat.type === 'empty' ? 0.3 : 1,
        }}
        title={`${seat.number || `${rowIndex + 1}-${colIndex + 1}`} - ${SEAT_TYPES[seat.type]?.name || 'Normal'}${isDuplicate ? ' (DUPLICATE - Double-click to edit)' : ''}`}
      >
        {isSeat(seat.type) ? (
          <span className="text-xs font-bold">
            {seat.number?.slice(-2) || `${colIndex + 1}`}
          </span>
        ) : (
          seat.type === 'walkway' && (
            <span className="text-xs">{SEAT_TYPES[seat.type]?.icon}</span>
          )
        )}
      </button>
      
      {isDuplicate && (
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center z-10">
          <ExclamationTriangleIcon className="w-2.5 h-2.5" />
        </div>
      )}
    </div>
  );
}
