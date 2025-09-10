import { useState } from 'react';
import { ExclamationTriangleIcon, PencilIcon } from '@heroicons/react/24/outline';
import type { SeatPosition } from '../../../types';
import { isSeat } from '../../../utils/seatNumbering';
import { SEAT_TYPES } from '../../../constants/seatTypes';

interface SeatButtonProps {
  seat: SeatPosition;
  rowIndex: number;
  colIndex: number;
  isDuplicate: boolean;
  onClick: (rowIndex: number, colIndex: number) => void;
  onEdit: (rowIndex: number, colIndex: number) => void; // Renamed for clarity
}

export default function SeatButton({
  seat,
  rowIndex,
  colIndex,
  isDuplicate,
  onClick,
  onEdit
}: SeatButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [clickTimeout, setClickTimeout] = useState<number | null>(null);
  
  const canEdit = isSeat(seat.type);
  
  // Handle click with delay to distinguish from double-click
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Clear existing timeout
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }
    
    // Set new timeout for single click
    const timeout = setTimeout(() => {
      onClick(rowIndex, colIndex);
    }, 200); // 200ms delay
    
    setClickTimeout(timeout);
  };
  
  // Handle double-click (cancels single click)
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Cancel single click timeout
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }
    
    // Only allow editing for seats
    if (canEdit) {
      onEdit(rowIndex, colIndex);
    }
  };
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 text-xs font-medium flex items-center justify-center relative ${
          isSeat(seat.type)
            ? `border-gray-300 cursor-pointer hover:border-gray-400 ${
                isDuplicate ? 'ring-2 ring-red-400 border-red-400' : ''
              } ${canEdit ? 'hover:ring-2 hover:ring-blue-300' : ''}`
            : 'border-gray-200 cursor-pointer bg-gray-100'
        }`}
        style={{
          backgroundColor: isDuplicate ? '#FEE2E2' : (SEAT_TYPES[seat.type]?.color || '#10B981'),
          color: isSeat(seat.type) ? (isDuplicate ? '#DC2626' : 'white') : '#6B7280',
          opacity: seat.type === 'empty' ? 0.3 : 1,
        }}
        title={`${seat.number || `${rowIndex + 1}-${colIndex + 1}`} - ${SEAT_TYPES[seat.type]?.name || 'Normal'}${
          isDuplicate ? ' (DUPLICATE)' : ''
        }${canEdit ? ' - Double-click to edit number' : ''}`}
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
      
      {/* Duplicate warning icon */}
      {isDuplicate && (
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center z-10">
          <ExclamationTriangleIcon className="w-2.5 h-2.5" />
        </div>
      )}
      
      {/* Edit indicator on hover for seats */}
      {canEdit && isHovered && !isDuplicate && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center z-10">
          <PencilIcon className="w-2.5 h-2.5" />
        </div>
      )}
      
      {/* Double-click hint for duplicates */}
      {isDuplicate && isHovered && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20">
          Double-click to fix
        </div>
      )}
    </div>
  );
}
