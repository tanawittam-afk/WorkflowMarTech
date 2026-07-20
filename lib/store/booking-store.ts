"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  BEVERAGE_ORDERS,
  BOOKINGS,
  CUSTOMERS,
  NOTIFICATIONS,
  REVIEWS,
  ROOMS,
  TODAY_ISO,
  WINBACK_DISCOUNT,
  ZONES,
} from "@/lib/data/mock-data";
import type { BookingRepo } from "@/lib/data/repo";
import type {
  BeverageOrder,
  Booking,
  Customer,
  LineNotification,
  NewBookingInput,
  NewCustomerInput,
  OrderLine,
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
  orders: BeverageOrder[];

  // CDP activation state (MarTech brief)
  dynamicPricing: boolean;
  activeBundles: string[]; // BundleRule ids live on the booking page
  winBackSent: string[]; // customerIds already sent a win-back coupon

  loginAsMarketing: () => void;
  loginAsCustomer: (customerId: string) => void;
  logout: () => void;
  registerCustomer: (input: NewCustomerInput) => Customer;
  createBooking: (input: NewBookingInput) => Booking;
  checkIn: (bookingId: string) => Booking;
  checkOut: (bookingId: string) => Booking;
  submitCsat: (bookingId: string, rating: 1 | 2 | 3 | 4 | 5) => void;
  clickCoupon: (notificationId: string) => void;
  addOrder: (bookingId: string, lines: OrderLine[]) => BeverageOrder;
  toggleDynamicPricing: () => void;
  toggleBundle: (ruleId: string) => void;
  sendWinBackCoupon: (customerId: string) => void;
  /** Discards every demo-created delta and restores the seeded dataset. Keeps the current session so a live demo does not get logged out mid-presentation. */
  resetDemo: () => void;
}

let nextCustomerSeq = CUSTOMERS.length + 1;
let nextBookingSeq = BOOKINGS.length + 1;
let nextOrderSeq = BEVERAGE_ORDERS.length + 1;

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
      orders: BEVERAGE_ORDERS,
      dynamicPricing: false,
      activeBundles: [],
      winBackSent: [],

      loginAsMarketing: () => set({ role: "marketing", currentCustomerId: null }),

      loginAsCustomer: (customerId) => set({ role: "customer", currentCustomerId: customerId }),

      logout: () => set({ role: null, currentCustomerId: null }),

      registerCustomer: (input) => {
        const seq = nextCustomerSeq++;
        const customerId = `C${String(seq).padStart(3, "0")}`;
        // Simulated LINE OA registration mints the cross-touchpoint LINE UID.
        const lineUid = `U${(0x1000000 + seq * 0x8f7c3).toString(16).slice(0, 8)}`;
        const customer: Customer = { customerId, lineUid, ...input };
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

      addOrder: (bookingId, lines) => {
        const booking = get().bookings.find((b) => b.id === bookingId)!;
        const order: BeverageOrder = {
          id: `OR${String(nextOrderSeq++).padStart(3, "0")}`,
          bookingId,
          customerId: booking.customerId,
          lines,
          amount: lines.reduce((s, l) => s + l.unitPrice * l.qty, 0),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ orders: [...s.orders, order] }));
        return order;
      },

      toggleDynamicPricing: () => set((s) => ({ dynamicPricing: !s.dynamicPricing })),

      toggleBundle: (ruleId) =>
        set((s) => ({
          activeBundles: s.activeBundles.includes(ruleId)
            ? s.activeBundles.filter((id) => id !== ruleId)
            : [...s.activeBundles, ruleId],
        })),

      // Fires a personalised win-back coupon into the customer's (simulated)
      // LINE OA feed — it shows up on their notifications page, and the
      // booking-confirm page auto-applies the discount on their next booking.
      sendWinBackCoupon: (customerId) => {
        if (get().winBackSent.includes(customerId)) return;
        const customer = get().customers.find((c) => c.customerId === customerId);
        const notification: LineNotification = {
          id: `N${String(get().notifications.length + 1).padStart(3, "0")}-WB-${customerId}`,
          customerId,
          kind: "broadcast-coupon",
          message: `We miss you${customer ? `, ${customer.name.split(" ")[0]}` : ""}! Here's ${Math.round(WINBACK_DISCOUNT * 100)}% off your next room booking.`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          winBackSent: [...s.winBackSent, customerId],
          notifications: [...s.notifications, notification],
        }));
      },

      resetDemo: () => {
        // ID sequences live outside the store, so they must rewind too —
        // otherwise post-reset records resume numbering from the old run.
        nextCustomerSeq = CUSTOMERS.length + 1;
        nextBookingSeq = BOOKINGS.length + 1;
        nextOrderSeq = BEVERAGE_ORDERS.length + 1;
        set({
          customers: CUSTOMERS,
          bookings: BOOKINGS,
          notifications: NOTIFICATIONS,
          orders: BEVERAGE_ORDERS,
          reviews: REVIEWS,
          dynamicPricing: false,
          activeBundles: [],
          winBackSent: [],
        });
      },
    }),
    {
      name: "bookingweb-session",
      // v2: MarTech-brief retrofit (new zones/rooms/pricing + beverage
      // orders). Old persisted snapshots reference zone ids that no longer
      // exist, so any pre-v2 state is discarded in favour of fresh seed data.
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2) return undefined as never;
        return persisted as never;
      },
      // Only persist session + the deltas a demo adds on top of seed data —
      // keeps the seeded dataset itself always sourced from mock-data.ts.
      partialize: (s) => ({
        role: s.role,
        currentCustomerId: s.currentCustomerId,
        customers: s.customers,
        bookings: s.bookings,
        notifications: s.notifications,
        orders: s.orders,
        dynamicPricing: s.dynamicPricing,
        activeBundles: s.activeBundles,
        winBackSent: s.winBackSent,
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
  listOrders: (bookingId) => {
    const orders = useBookingStore.getState().orders;
    return Promise.resolve(bookingId ? orders.filter((o) => o.bookingId === bookingId) : orders);
  },
  addOrder: (bookingId, lines) => Promise.resolve(useBookingStore.getState().addOrder(bookingId, lines)),
  sendWinBackCoupon: (customerId) => {
    useBookingStore.getState().sendWinBackCoupon(customerId);
    return Promise.resolve();
  },
};
