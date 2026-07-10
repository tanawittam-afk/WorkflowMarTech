// Repo interface — the backend upgrade slot. The UI reads/mutates only
// through this shape; `mockRepo` (lib/store/booking-store.ts) implements it
// over an in-memory Zustand store. A future `supabaseRepo` can implement the
// same interface with real network calls and every consuming component
// needs zero changes.

import type {
  Booking,
  Customer,
  LineNotification,
  NewBookingInput,
  NewCustomerInput,
  Review,
  Room,
  Zone,
  ZoneId,
} from "./types";

export interface BookingRepo {
  listCustomers(): Promise<Customer[]>;
  listZones(): Promise<Zone[]>;
  listRooms(zoneId?: ZoneId): Promise<Room[]>;
  listBookings(filter?: { customerId?: string; date?: string }): Promise<Booking[]>;
  listReviews(): Promise<Review[]>;
  listNotifications(customerId?: string): Promise<LineNotification[]>;
  createBooking(input: NewBookingInput): Promise<Booking>;
  checkIn(bookingId: string): Promise<Booking>;
  checkOut(bookingId: string): Promise<Booking>;
  submitCsat(bookingId: string, rating: 1 | 2 | 3 | 4 | 5): Promise<void>;
  registerCustomer(input: NewCustomerInput): Promise<Customer>;
  clickCoupon(notificationId: string): Promise<void>;
}
