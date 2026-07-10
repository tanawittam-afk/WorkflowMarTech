export type Occupation = "Students" | "Freelancers";

/** The 9 required customer data points. */
export interface Customer {
  customerId: string; // "C001", "C002", ...
  name: string;
  gender: "Male" | "Female" | "Other";
  age: number;
  address: string;
  occupation: Occupation;
  income: number; // monthly THB
  phoneNumber: string;
  email: string;
}

export type ZoneId = "zone-1-studio" | "zone-2-coworking" | "zone-3-cafe";

export interface Zone {
  id: ZoneId;
  name: string;
  shortName: string;
  description: string;
  hourlyRate: number; // THB
  capacity: number;
  amenities: string[];
}

export interface Room {
  id: string;
  zoneId: ZoneId;
  name: string;
  capacity: number;
  isBookable: boolean;
}

export type BookingStatus = "upcoming" | "checked-in" | "completed" | "cancelled";

export interface Booking {
  id: string;
  customerId: string;
  zoneId: ZoneId;
  roomId: string;
  date: string; // ISO date, "2026-06-20"
  startTime: string; // "14:00"
  endTime: string; // "16:00"
  amountPaid: number; // THB
  status: BookingStatus;
  qrToken: string;
  checkInAt?: string;
  checkOutAt?: string;
  csatRating?: 1 | 2 | 3 | 4 | 5;
}

export interface Review {
  id: string;
  customerId: string;
  zoneId: ZoneId;
  bookingId?: string;
  date: string;
  text: string;
  rating: 1 | 2 | 3 | 4 | 5;
}

export type NotificationKind = "booking-confirmation" | "broadcast-coupon" | "loyalty-stamp";

export interface LineNotification {
  id: string;
  customerId: string;
  kind: NotificationKind;
  message: string;
  createdAt: string; // ISO date
  clickedCoupon?: boolean;
  ledToCheckIn?: boolean;
}

export interface NewBookingInput {
  customerId: string;
  zoneId: ZoneId;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  amountPaid: number;
}

export interface NewCustomerInput {
  name: string;
  gender: Customer["gender"];
  age: number;
  address: string;
  occupation: Occupation;
  income: number;
  phoneNumber: string;
  email: string;
}
