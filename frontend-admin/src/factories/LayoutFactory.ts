import type { SeatPosition } from '../types';
import { SEAT_TYPES } from '../constants/seatTypes';

export class LayoutFactory {
  static createInitialLayout(rows: number, columns: number): SeatPosition[][] {
    const layout: SeatPosition[][] = [];
    for (let row = 0; row < rows; row++) {
      const rowSeats: SeatPosition[] = [];
      for (let col = 0; col < columns; col++) {
        rowSeats.push({
          row: String.fromCharCode(65 + row),
          column: col + 1,
          type: 'normal',
          number: `${String.fromCharCode(65 + row)}${col + 1}`,
          price: SEAT_TYPES.normal.price,
          is_accessible: false,
          custom_number: '',
        });
      }
      layout.push(rowSeats);
    }
    return layout;
  }

  static createDefaultSeat(rowIndex: number, colIndex: number): SeatPosition {
    return {
      row: String.fromCharCode(65 + rowIndex),
      column: colIndex + 1,
      type: 'normal',
      number: `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`,
      price: SEAT_TYPES.normal.price,
      is_accessible: false,
      custom_number: '',
    };
  }
}
