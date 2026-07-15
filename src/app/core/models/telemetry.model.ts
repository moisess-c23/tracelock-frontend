export interface RoutePoint {
  recorded_at: string;
  lat: number;
  lng: number;
  speed: number;
}

export interface RouteHistoryResponse {
  vehicle_id: number;
  start: string;
  end: string;
  count: number;
  route: RoutePoint[];
}

export interface AvailableDatesResponse {
  vehicle_id: number;
  dates: string[];
}
