import type { SeatType } from '../types';

export const SEAT_TYPES: Record<string, SeatType> = {
  normal: { 
    name: 'Normal', 
    color: '#10B981', 
    price: 100, 
    available: true, 
    is_accessible: false, 
    icon: '🪑', 
    description: 'Standard seating' 
  },
  premium: { 
    name: 'Premium', 
    color: '#F59E0B', 
    price: 200, 
    available: true, 
    is_accessible: false, 
    icon: '✨', 
    description: 'Premium comfortable seats' 
  },
  disabled_access: { 
    name: 'Wheelchair Access', 
    color: '#3B82F6', 
    price: 100, 
    available: true, 
    is_accessible: true, 
    icon: '♿', 
    description: 'Wheelchair accessible seats' 
  },
  couple: { 
    name: 'Couple Seat', 
    color: '#EC4899', 
    price: 300, 
    available: true, 
    is_accessible: false, 
    icon: '💕', 
    description: 'Couple seating with shared armrest' 
  },
  recliner: { 
    name: 'Recliner', 
    color: '#8B5CF6', 
    price: 250, 
    available: true, 
    is_accessible: false, 
    icon: '🛋️', 
    description: 'Luxury reclining seats' 
  },
  walkway: { 
    name: 'Walkway/Aisle', 
    color: '#E5E7EB', 
    price: 0, 
    available: false, 
    is_accessible: false, 
    icon: '🚶', 
    description: 'Walking path - not counted in seating' 
  },
  empty: { 
    name: 'Empty Space', 
    color: 'transparent', 
    price: 0, 
    available: false, 
    is_accessible: false, 
    icon: '', 
    description: 'Empty space - not counted' 
  },
};

export const GRID_LIMITS = {
  MIN_ROWS: 1,
  MAX_ROWS: 20,
  MIN_COLUMNS: 1,
  MAX_COLUMNS: 30,
} as const;
