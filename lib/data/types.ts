export type Occupation = "Students" | "Freelancers";

/** The 9 required customer data points + LINE UID (the CDP's cross-touchpoint key). */
export interface Customer {
  customerId: string; // "C001", "C002", ... (internal key)
  lineUid: string; // "U1f2a8c31" — shown in UI as the unifying Customer ID
  name: string;
  gender: "Male" | "Female" | "Other";
  age: number;
  address: string;
  occupation: Occupation;
  income: number; // monthly THB
  phoneNumber: string;
  email: string;
}

/** Zones are the three room sizes per the MarTech brief. */
export type ZoneId = "zone-small" | "zone-medium" | "zone-large";

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

// ---------------------------------------------------------------------------
// Beverage upsell domain (in-room QR ordering, post-paid at checkout)
// ---------------------------------------------------------------------------

export interface Beverage {
  id: string;
  name: string; // Thai menu name (UI stays English elsewhere)
  price: number; // THB per unit
}

export interface OrderLine {
  bevId: string;
  qty: number;
  unitPrice: number; // captured at order time (bundle discounts change it)
}

/** One QR-order round inside a room; a booking can accumulate several. */
export interface BeverageOrder {
  id: string; // "OR001", ...
  bookingId: string;
  customerId: string;
  lines: OrderLine[];
  amount: number; // sum of lines
  createdAt: string; // ISO datetime
}

/** Simulated Apriori association rule powering Smart Bundling. */
export interface BundleRule {
  id: string;
  zoneId: ZoneId;
  hourFrom: number;
  hourTo: number;
  bevId: string;
  lift: number;
  confidence: number; // %
  pitch: string;
}
