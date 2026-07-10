"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  BOOKINGS,
  CUSTOMERS,
  NOTIFICATIONS,
  REVIEWS,
  ROOMS,
  TODAY_ISO,
  ZONES,
} from "@/lib/data/mock-data";
import type { BookingRepo } from "@/lib/data/repo";
import type {
  Booking,
  Customer,
  LineNotification,
  NewBookingInput,
  NewCustomerInput,
  Review,
  Room,
  Zone,
} from "@/lib/data/types";

export type UserRole = "marketing" | "customer" | null;

interface SessionState {
  role: UserRole;
  currentCustomerId: string | null;
}

interface BookingState extends SessionState {
  customers: Customer[];
  zones: Zone[];
  rooms: Room[];
  bookings: Booking[];
  reviews: Review[];
  notifications: LineNotification[];

  loginAsMarketing: () => void;
  loginAsCustomer: (customerId: string) => void;
  logout: () => void;
  registerCustomer: (input: NewCustomerInput) => Customer;
  createBooking: (input: NewBookingInput) => Booking;
  checkIn: (bookingId: string) => Booking;
  checkOut: (bookingId: string) => Booking;
  submitCsat: (bookingId: string, rating: 1 | 2 | 3 | 4 | 5) => void;
  clickCoupon: (notificationId: string) => void;
}

let nextCustomerSeq = CUSTOMERS.length + 1;
let nextBookingSeq = BOOKINGS.length + 1;

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      role: null,
      currentCustomerId: null,
      customers: CUSTOMERS,
      zones: ZONES,
      rooms: ROOMS,
      bookings: BOOKINGS,
      reviews: REVIEWS,
      notifications: NOTIFICATIONS,

      loginAsMarketing: () => set({ role: "marketing", currentCustomerId: null }),

      loginAsCustomer: (customerId) => set({ role: "customer", currentCustomerId: customerId }),

      logout: () => set({ role: null, currentCustomerId: null }),

      registerCustomer: (input) => {
        const customerId = `C${String(nextCustomerSeq++).padStart(3, "0")}`;
        const customer: Customer = { customerId, ...input };
        set((s) => ({ customers: [...s.customers, customer] }));
        return customer;
      },

      createBooking: (input) => {
        const id = `BK${String(nextBookingSeq++).padStart(3, "0")}`;
        const booking: Booking = {
          id,
          ...input,
          status: "upcoming",
          qrToken: `SS-${id}-${input.customerId}`,
        };
        set((s) => ({ bookings: [...s.bookings, booking] }));

        const zone = get().zones.find((z) => z.id === input.zoneId);
        const notification: LineNotification = {
          id: `N${String(get().notifications.length + 1).padStart(3, "0")}-${id}`,
          customerId: input.customerId,
          kind: "booking-confirmation",
          message: `Your booking for ${zone?.name ?? "Smart Space"} is confirmed.`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ notifications: [...s.notifications, notification] }));

        return booking;
      },

      checkIn: (bookingId) => {
        const now = new Date().toISOString();
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === bookingId ? { ...b, status: "checked-in", checkInAt: now } : b
          ),
        }));
        const booking = get().bookings.find((b) => b.id === bookingId)!;

        // A check-in right after a clicked coupon counts as an OA conversion.
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.customerId === booking.customerId && n.kind === "broadcast-coupon" && n.clickedCoupon && n.ledToCheckIn === undefined
              ? { ...n, ledToCheckIn: true }
              : n
          ),
        }));

        return booking;
      },

      checkOut: (bookingId) => {
        const now = new Date().toISOString();
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === bookingId ? { ...b, status: "completed", checkOutAt: now } : b
          ),
        }));
        return get().bookings.find((b) => b.id === bookingId)!;
      },

      submitCsat: (bookingId, rating) => {
        set((s) => ({
          bookings: s.bookings.map((b) => (b.id === bookingId ? { ...b, csatRating: rating } : b)),
        }));
      },

      clickCoupon: (notificationId) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === notificationId ? { ...n, clickedCoupon: true } : n
          ),
        }));
      },
    }),
    {
      name: "bookingweb-session",
      // Only persist session + the deltas a demo adds on top of seed data —
      // keeps the seeded dataset itself always sourced from mock-data.ts.
      partialize: (s) => ({
        role: s.role,
        currentCustomerId: s.currentCustomerId,
        customers: s.customers,
        bookings: s.bookings,
        notifications: s.notifications,
      }),
    }
  )
);

export { TODAY_ISO };

/** Async-shaped implementation of BookingRepo over the live store — the documented backend-swap seam. */
export const mockRepo: BookingRepo = {
  listCustomers: () => Promise.resolve(useBookingStore.getState().customers),
  listZones: () => Promise.resolve(useBookingStore.getState().zones),
  listRooms: (zoneId) => {
    const rooms = useBookingStore.getState().rooms;
    return Promise.resolve(zoneId ? rooms.filter((r) => r.zoneId === zoneId) : rooms);
  },
  listBookings: (filter) => {
    let bookings = useBookingStore.getState().bookings;
    if (filter?.customerId) bookings = bookings.filter((b) => b.customerId === filter.customerId);
    if (filter?.date) bookings = bookings.filter((b) => b.date === filter.date);
    return Promise.resolve(bookings);
  },
  listReviews: () => Promise.resolve(useBookingStore.getState().reviews),
  listNotifications: (customerId) => {
    const notifications = useBookingStore.getState().notifications;
    return Promise.resolve(
      customerId ? notifications.filter((n) => n.customerId === customerId) : notifications
    );
  },
  createBooking: (input) => Promise.resolve(useBookingStore.getState().createBooking(input)),
  checkIn: (bookingId) => Promise.resolve(useBookingStore.getState().checkIn(bookingId)),
  checkOut: (bookingId) => Promise.resolve(useBookingStore.getState().checkOut(bookingId)),
  submitCsat: (bookingId, rating) => {
    useBookingStore.getState().submitCsat(bookingId, rating);
    return Promise.resolve();
  },
  registerCustomer: (input) => Promise.resolve(useBookingStore.getState().registerCustomer(input)),
  clickCoupon: (notificationId) => {
    useBookingStore.getState().clickCoupon(notificationId);
    return Promise.resolve();
  },
};
