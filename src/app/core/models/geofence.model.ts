export type GeofenceType = 'circle' | 'polygon';
export type GeofenceZoneType = 'permitted' | 'forbidden';
export type GeofenceSeverity = 'low' | 'medium' | 'critical';

export interface GeofenceCoordinate {
  lat: number;
  lng: number;
}

export interface GeofenceGeometry {
  type: string;
  coordinates: any;
}

export interface Geofence {
  id: string;
  name: string;
  description: string;
  type: GeofenceType;
  zoneType: GeofenceZoneType;
  severity: GeofenceSeverity;
  coordinates?: GeofenceCoordinate[];
  geometry?: GeofenceGeometry;
  radius?: number;
  isActive: boolean;
  color: string;
  createdAt: Date;
  vehicleIds: string[];
  geoJson?: any;
}
