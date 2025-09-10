// utils/seatNumbering.ts
import type { SeatPosition } from '../types';

export function generateSeatNumber(
  rowIndex: number,
  colIndex: number,
  layout: SeatPosition[][],
  numberingScheme: string,
  rowNaming: string,
  customRowNames?: string[],
  customNumber?: string
): string {
  // Use custom number if provided
  if (customNumber && customNumber.trim() !== '') {
    return customNumber;
  }

  const row = layout[rowIndex];
  
  // Count actual seats in this row up to this column
  let seatCount = 0;
  for (let i = 0; i <= colIndex; i++) {
    if (row[i] && !['walkway', 'empty'].includes(row[i].type)) {
      seatCount++;
    }
  }

  // Calculate actual row index (skip walkway-only rows)
  let actualRowIndex = 0;
  for (let i = 0; i <= rowIndex; i++) {
    const hasSeat = layout[i]?.some(seat => !['walkway', 'empty'].includes(seat.type));
    if (hasSeat) actualRowIndex++;
  }
  actualRowIndex--;

  // Generate row label
  let rowLabel = '';
  if (rowNaming === 'alphabetic') {
    rowLabel = String.fromCharCode(65 + actualRowIndex);
  } else if (rowNaming === 'numeric') {
    rowLabel = `${actualRowIndex + 1}`;
  } else if (rowNaming === 'custom') {
    rowLabel = customRowNames?.[actualRowIndex] || '';
  }

  // Generate full seat number
  if (numberingScheme === 'alphabetic') {
    return `${rowLabel}${seatCount}`;
  } else if (numberingScheme === 'numeric') {
    return `${actualRowIndex + 1}-${seatCount}`;
  }
  
  return `${rowLabel}${seatCount}`;
}

export function isSeat(seatType: string): boolean {
  return seatType !== 'walkway' && seatType !== 'empty';
}

export function getActualRowCount(layout: SeatPosition[][]): number {
  return layout.filter(row => row.some(seat => isSeat(seat.type))).length;
}
