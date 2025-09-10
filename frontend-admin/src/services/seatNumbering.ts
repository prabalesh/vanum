import type { SeatPosition } from '../types';
import { isSeat } from '../utils/seatNumbering';

export class SeatNumberingService {
  static getActualRowIndexForGridRow(gridRowIndex: number, layout: SeatPosition[][]): number {
    let actualRowIndex = 0;
    for (let i = 0; i < gridRowIndex; i++) {
      const row = layout?.[i];
      if (row && row.some(seat => isSeat(seat.type))) {
        actualRowIndex++;
      }
    }
    return actualRowIndex;
  }

  static generateRowName(
    gridRowIndex: number,
    layout: SeatPosition[][],
    rowNaming: string,
    customRowNames: string[]
  ): string {
    const currentRow = layout?.[gridRowIndex];
    const currentRowHasSeats = currentRow && currentRow.some(seat => isSeat(seat.type));
    
    if (!currentRowHasSeats) {
      return '';
    }

    const actualRowIndex = this.getActualRowIndexForGridRow(gridRowIndex, layout);
    
    switch (rowNaming) {
      case 'alphabetic':
        return String.fromCharCode(65 + actualRowIndex);
      case 'numeric':
        return `${actualRowIndex + 1}`;
      case 'custom':
        return customRowNames[actualRowIndex] || String.fromCharCode(65 + actualRowIndex);
      default:
        return String.fromCharCode(65 + actualRowIndex);
    }
  }

  static generateSeatNumber(
    gridRowIndex: number,
    colIndex: number,
    layout: SeatPosition[][],
    numberingScheme: string,
    rowNaming: string,
    customRowNames: string[]
  ): string {
    const row = layout?.[gridRowIndex];
    if (!row) return '';
    
    // Count only actual seats in this row up to this column position
    let seatCount = 0;
    for (let i = 0; i <= colIndex; i++) {
      if (row[i] && isSeat(row[i].type)) {
        seatCount++;
      }
    }
    
    if (seatCount === 0) return '';

    const rowName = this.generateRowName(gridRowIndex, layout, rowNaming, customRowNames);
    if (!rowName) return '';

    if (numberingScheme === 'alphabetic') {
      return `${rowName}${seatCount}`;
    } else if (numberingScheme === 'numeric') {
      const actualRowIndex = this.getActualRowIndexForGridRow(gridRowIndex, layout);
      return `${actualRowIndex + 1}-${seatCount}`;
    }
    return `${rowName}${seatCount}`;
  }

  static shouldShowRowLabel(gridRowIndex: number, layout: SeatPosition[][]): boolean {
    const row = layout?.[gridRowIndex];
    return row ? row.some(seat => isSeat(seat.type)) : false;
  }
}
