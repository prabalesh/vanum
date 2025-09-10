import type { SeatLayoutConfig } from '../../../types';
import { SeatNumberingService } from '../../../services/seatNumbering';
import { LayoutFactory } from '../../../factories/LayoutFactory';
import SeatButton from './SeatButton';
import RowLabel from './RowLabel';

interface SeatGridProps {
  layout: SeatLayoutConfig;
  selectedRows: Set<number>;
  rowNaming: string;
  customRowNames: string[];
  isDuplicate: (rowIndex: number, colIndex: number) => boolean;
  onSeatClick: (rowIndex: number, colIndex: number) => void;
  onSeatEdit: (rowIndex: number, colIndex: number) => void; // Add this
  onRowSelect: (rowIndex: number) => void;
  onRowToggle: (rowIndex: number) => void;
}

export default function SeatGrid({
  layout,
  selectedRows,
  rowNaming,
  customRowNames,
  isDuplicate,
  onSeatClick,
  onSeatEdit, // Make sure this prop is defined
  onRowSelect,
  onRowToggle
}: SeatGridProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="text-center mb-4">
        <div className="bg-gray-800 text-white py-2 px-8 rounded-md inline-block">
          🎬 SCREEN 🎬
        </div>
      </div>

      <div className="flex justify-center">
        <div className="space-y-1">
          {Array.from({ length: layout.rows }, (_, rowIndex) => {
            const isRowSelected = selectedRows.has(rowIndex);
            const rowHasSeats = SeatNumberingService.shouldShowRowLabel(rowIndex, layout.layout || []);
            const rowLabel = SeatNumberingService.generateRowName(
              rowIndex,
              layout.layout || [],
              rowNaming,
              customRowNames
            );
            
            return (
              <div key={rowIndex} className="flex items-center space-x-1">
                <RowLabel
                  rowIndex={rowIndex}
                  isSelected={isRowSelected}
                  hasSeats={rowHasSeats}
                  label={rowLabel}
                  onSelect={onRowSelect}
                  onToggleWalkway={onRowToggle}
                />
                
                <div className="flex space-x-1">
                  {Array.from({ length: layout.columns }, (_, colIndex) => {
                    const seat = layout.layout?.[rowIndex]?.[colIndex] || 
                      LayoutFactory.createDefaultSeat(rowIndex, colIndex);
                    
                    return (
                      <SeatButton
                        key={`${rowIndex}-${colIndex}`}
                        seat={seat}
                        rowIndex={rowIndex}
                        colIndex={colIndex}
                        isDuplicate={isDuplicate(rowIndex, colIndex)}
                        onClick={onSeatClick}
                        onEdit={onSeatEdit} // Make sure this is passed
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}