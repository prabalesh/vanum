import type { SeatLayoutConfig, SeatPosition } from '../types';
import { isSeat, getActualRowCount } from '../utils/seatNumbering';

export interface DuplicateAnalysis {
  duplicateNumbers: string[];
  seatNumberCounts: Record<string, number>;
  duplicatePositions: Set<string>;
}

export interface LayoutStatistics {
  totalSeats: number;
  accessibleSeats: number;
  actualRowCount: number;
}

export class LayoutValidationService {
  static analyzeDuplicates(layout: SeatPosition[][] | undefined): DuplicateAnalysis {
    console.log('Analyzing layout for duplicates:', layout); // Debug
    
    if (!layout || layout.length === 0) {
      return { 
        duplicateNumbers: [], 
        seatNumberCounts: {}, 
        duplicatePositions: new Set() 
      };
    }

    const counts: Record<string, number> = {};
    const positions: Record<string, Array<{row: number, col: number}>> = {};
    
    // Count all seat numbers and track their positions
    layout.forEach((row, rowIndex) => {
      if (!row) return;
      row.forEach((seat, colIndex) => {
        if (seat?.number && isSeat(seat.type) && seat.number.trim()) {
          const seatNumber = seat.number.trim();
          counts[seatNumber] = (counts[seatNumber] || 0) + 1;
          
          if (!positions[seatNumber]) {
            positions[seatNumber] = [];
          }
          positions[seatNumber].push({ row: rowIndex, col: colIndex });
        }
      });
    });
    
    // Find duplicates
    const duplicates: string[] = [];
    const duplicatePositions = new Set<string>();
    
    Object.entries(counts).forEach(([number, count]) => {
      if (count > 1) {
        duplicates.push(number);
        
        // Mark all positions with this duplicate number
        positions[number]?.forEach(({ row, col }) => {
          duplicatePositions.add(`${row}-${col}`);
        });
      }
    });
    
    console.log('Duplicate analysis result:', { 
      duplicates, 
      counts, 
      duplicatePositions: Array.from(duplicatePositions) 
    }); // Debug
    
    return { 
      duplicateNumbers: duplicates, 
      seatNumberCounts: counts,
      duplicatePositions: duplicatePositions
    };
  }

  static calculateStatistics(layout: SeatPosition[][] | undefined): LayoutStatistics {
    if (!layout) {
      return { totalSeats: 0, accessibleSeats: 0, actualRowCount: 0 };
    }

    const totalSeats = layout.reduce((total, row) => 
      total + row.filter(seat => isSeat(seat.type)).length, 0
    );
    
    const accessibleSeats = layout.reduce((total, row) => 
      total + row.filter(seat => 
        isSeat(seat.type) && (seat.is_accessible || seat.type === 'disabled_access')
      ).length, 0
    );
    
    const actualRowCount = getActualRowCount(layout);

    return { totalSeats, accessibleSeats, actualRowCount };
  }

  static validateLayout(
    layout: SeatLayoutConfig,
    rowNaming: string,
    customRowNames: string[],
    actualRowCount: number,
    duplicateNumbers: string[]
  ): boolean {
    const hasSeats = layout.layout && layout.layout.some(row => 
      row.some(seat => isSeat(seat.type))
    );
    
    const validRowNames = rowNaming !== 'custom' || 
      (customRowNames.length >= actualRowCount && 
       customRowNames.slice(0, actualRowCount).every(name => name && name.trim()));
    
    const noDuplicates = duplicateNumbers.length === 0;
    
    return hasSeats && validRowNames && actualRowCount > 0 && noDuplicates;
  }

  static validateSeatNumber(
    newNumber: string, 
    currentRowIndex: number, 
    currentColIndex: number,
    layout: SeatPosition[][] | undefined,
    seatNumberCounts: Record<string, number>
  ): boolean {
    if (!newNumber.trim()) return false;
    
    const currentSeat = layout?.[currentRowIndex]?.[currentColIndex];
    
    // Allow if it's the same number (editing existing)
    if (newNumber === currentSeat?.number) return true;
    
    // Check if number already exists
    return !Object.keys(seatNumberCounts).includes(newNumber);
  }
}
