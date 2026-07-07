/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'ADMIN' | 'PARTNER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  color: string; // Tailored color accent for the calendar UI
  phone?: string; // Stored for SMS notifications
  isActive: boolean;
}

export interface Location {
  id: string;
  name: string;
  code: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  color: string; // Tailwind color token representation
  isActive: boolean;
}

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  locationId: string;
  date: string; // YYYY-MM-DD
  hours: number;
  hourlyRate: number;
}

export interface AppSettings {
  maxPartnersPerDay: number; // 1 or 2
  defaultHourlyRate: number; // e.g. 20
  defaultHoursPerDay: number; // e.g. 8
  cancellationDeadlineDays: number; // e.g. 2
  notificationEmail?: string; // cib@bicuiterie-louvat.com
  enableEmailAlerts?: boolean;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  type: 'EMAIL' | 'SMS';
  recipient: string;
  subject: string;
  message: string;
  status: 'SENT' | 'QUEUED';
}
