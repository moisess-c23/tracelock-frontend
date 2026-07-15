export type VehicleStatusCode = 'in_route' | 'idle' | 'stopped' | 'maintenance';

export type VehicleStatus = VehicleStatusCode;

export interface VehicleStatusOption {
  id: string;
  name: string;
  code: VehicleStatusCode;
}

export interface VehicleTelemetry {
  fuel: number;
  temp: number;
  odometer: number;
}

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  driver: string;
  statusId: string;
  status: VehicleStatusCode;
  statusName: string;
  latitude: number;
  longitude: number;
  speed: number;
  batteryPercent: number;
  telemetry: VehicleTelemetry;
  lastUpdated: Date;
}
