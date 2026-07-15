export type AlertType = 'geofence_exit' | 'geofence_entry' | 'overspeed' | 'panic' | 'low_battery';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  timestamp: Date;
  vehicleId: string;
  vehicleName: string;
  geofenceId?: string;
  geofenceName?: string;
  resolved: boolean;
}
