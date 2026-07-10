import type { Booking, Customer, LineNotification, Review, Room, Zone } from "./types";

// Fixed "today" for this prototype so seeded data (last-30-days trends,
// "days since last booking" churn math) stays stable across reloads.
export const TODAY_ISO = "2026-07-06";

function isoDaysAgo(daysAgo: number): string {
  const d = new Date(`${TODAY_ISO}T00:00:00`);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function hhmm(hour: number, minute = 0): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Customers — 18 hand-authored records, all 9 required fields.
// Income bands deliberately wide (students ~5-9.5k THB, freelancers
// ~28-80k THB) so K-Means clustering on age+income has real signal.
// ---------------------------------------------------------------------------
export const CUSTOMERS: Customer[] = [
  { customerId: "C001", name: "Natthaphong Srisawat", gender: "Male", age: 21, address: "Chatuchak, Bangkok", occupation: "Students", income: 8000, phoneNumber: "081-234-5671", email: "natthaphong.s@example.com" },
  { customerId: "C002", name: "Chidchanok Boonmee", gender: "Female", age: 23, address: "Thonglor, Bangkok", occupation: "Freelancers", income: 42000, phoneNumber: "089-234-5672", email: "chidchanok.b@example.com" },
  { customerId: "C003", name: "Kittipong Wattana", gender: "Male", age: 20, address: "Ramkhamhaeng, Bangkok", occupation: "Students", income: 6000, phoneNumber: "086-234-5673", email: "kittipong.w@example.com" },
  { customerId: "C004", name: "Supaporn Chaiyasit", gender: "Female", age: 27, address: "Ari, Bangkok", occupation: "Freelancers", income: 58000, phoneNumber: "082-234-5674", email: "supaporn.c@example.com" },
  { customerId: "C005", name: "Anucha Phromsri", gender: "Male", age: 19, address: "Ramkhamhaeng, Bangkok", occupation: "Students", income: 5500, phoneNumber: "084-234-5675", email: "anucha.p@example.com" },
  { customerId: "C006", name: "Waraporn Ketkaew", gender: "Female", age: 25, address: "Thonglor, Bangkok", occupation: "Freelancers", income: 35000, phoneNumber: "087-234-5676", email: "waraporn.k@example.com" },
  { customerId: "C007", name: "Thanakorn Rungrueang", gender: "Male", age: 22, address: "Chatuchak, Bangkok", occupation: "Students", income: 9000, phoneNumber: "083-234-5677", email: "thanakorn.r@example.com" },
  { customerId: "C008", name: "Ratchanok Intharaphan", gender: "Female", age: 30, address: "Ari, Bangkok", occupation: "Freelancers", income: 72000, phoneNumber: "088-234-5678", email: "ratchanok.i@example.com" },
  { customerId: "C009", name: "Pornchai Suksawat", gender: "Male", age: 24, address: "Thonglor, Bangkok", occupation: "Freelancers", income: 28000, phoneNumber: "081-345-6789", email: "pornchai.s@example.com" },
  { customerId: "C010", name: "Napaporn Thongdee", gender: "Female", age: 20, address: "Ramkhamhaeng, Bangkok", occupation: "Students", income: 7000, phoneNumber: "089-345-6780", email: "napaporn.t@example.com" },
  { customerId: "C011", name: "Ekachai Yodkaew", gender: "Male", age: 33, address: "Ari, Bangkok", occupation: "Freelancers", income: 65000, phoneNumber: "086-345-6781", email: "ekachai.y@example.com" },
  { customerId: "C012", name: "Siriporn Boonrod", gender: "Female", age: 21, address: "Chatuchak, Bangkok", occupation: "Students", income: 8500, phoneNumber: "082-345-6782", email: "siriporn.b@example.com" },
  { customerId: "C013", name: "Wichai Saengthong", gender: "Male", age: 29, address: "Thonglor, Bangkok", occupation: "Freelancers", income: 48000, phoneNumber: "084-345-6783", email: "wichai.s@example.com" },
  { customerId: "C014", name: "Malee Rattanakosin", gender: "Female", age: 22, address: "Ramkhamhaeng, Bangkok", occupation: "Students", income: 6500, phoneNumber: "087-345-6784", email: "malee.r@example.com" },
  { customerId: "C015", name: "Somchai Tanawat", gender: "Male", age: 26, address: "Ari, Bangkok", occupation: "Freelancers", income: 51000, phoneNumber: "083-345-6785", email: "somchai.t@example.com" },
  { customerId: "C016", name: "Kanokwan Phueng", gender: "Female", age: 19, address: "Chatuchak, Bangkok", occupation: "Students", income: 5000, phoneNumber: "088-345-6786", email: "kanokwan.p@example.com" },
  { customerId: "C017", name: "Decha Isarapong", gender: "Male", age: 31, address: "Thonglor, Bangkok", occupation: "Freelancers", income: 80000, phoneNumber: "081-456-7891", email: "decha.i@example.com" },
  { customerId: "C018", name: "Ploenpit Wongsawan", gender: "Female", age: 23, address: "Ramkhamhaeng, Bangkok", occupation: "Students", income: 9500, phoneNumber: "089-456-7892", email: "ploenpit.w@example.com" },
];

// ---------------------------------------------------------------------------
// Zones & Rooms — fixed reference data.
// ---------------------------------------------------------------------------
export const ZONES: Zone[] = [
  {
    id: "zone-1-studio",
    name: "Live & Podcast Studio",
    shortName: "Studio",
    description: "Soundproof rooms fully equipped with lights, cameras, and streaming mics.",
    hourlyRate: 500,
    capacity: 6,
    amenities: ["Soundproof walls", "Streaming mics", "Ring lights", "4K cameras", "Green screen"],
  },
  {
    id: "zone-2-coworking",
    name: "Private Meeting Rooms & Hot Desks",
    shortName: "Meeting & Desks",
    description: "Flexible co-working areas and private glass-walled meeting spaces.",
    hourlyRate: 250,
    capacity: 20,
    amenities: ["Glass-walled meeting rooms", "Hot desks", "High-speed wifi", "Whiteboard", "Free printing"],
  },
  {
    id: "zone-3-cafe",
    name: "Creator Cafe",
    shortName: "Cafe",
    description: "An in-house espresso bar selling coffee, snacks, and energy drinks.",
    hourlyRate: 100,
    capacity: 30,
    amenities: ["Espresso bar", "Snacks", "Energy drinks", "Free wifi", "Bar seating"],
  },
];

export const ROOMS: Room[] = [
  { id: "room-studio-a", zoneId: "zone-1-studio", name: "Podcast Booth A", capacity: 4, isBookable: true },
  { id: "room-studio-b", zoneId: "zone-1-studio", name: "Live Streaming Studio B", capacity: 6, isBookable: true },
  { id: "room-meeting-a", zoneId: "zone-2-coworking", name: "Meeting Room A (Glass)", capacity: 6, isBookable: true },
  { id: "room-meeting-b", zoneId: "zone-2-coworking", name: "Meeting Room B (Glass)", capacity: 8, isBookable: true },
  { id: "room-hotdesk-1", zoneId: "zone-2-coworking", name: "Hot Desk Cluster 1", capacity: 10, isBookable: true },
  { id: "room-hotdesk-2", zoneId: "zone-2-coworking", name: "Hot Desk Cluster 2", capacity: 10, isBookable: true },
  { id: "room-cafe-tables", zoneId: "zone-3-cafe", name: "Cafe Seating", capacity: 30, isBookable: true },
];

// ---------------------------------------------------------------------------
// Bookings — hand-specified table (customerIdx, zoneIdx, roomId, daysAgo,
// startHour, durationHours, status, csat). Weighted toward 14:00-19:00 to
// reproduce the brief's "peak 2-7pm" occupancy claim.
// ---------------------------------------------------------------------------
type BookingRow = [number, number, string, number, number, number, Booking["status"], Booking["csatRating"]];

const BOOKING_ROWS: BookingRow[] = [
  [0, 0, "room-studio-a", 25, 10, 2, "completed", 5],
  [1, 2, "room-cafe-tables", 24, 15, 1, "completed", 4],
  [2, 1, "room-hotdesk-1", 23, 16, 3, "completed", 2],
  [3, 1, "room-meeting-a", 22, 14, 2, "completed", 5],
  [4, 0, "room-studio-b", 21, 17, 2, "completed", 3],
  [5, 2, "room-cafe-tables", 20, 15, 1, "completed", 5],
  [6, 1, "room-hotdesk-2", 19, 14, 4, "completed", 2],
  [7, 0, "room-studio-a", 18, 18, 2, "completed", 5],
  [8, 1, "room-meeting-b", 17, 16, 2, "completed", 5],
  [9, 2, "room-cafe-tables", 16, 11, 1, "completed", 3],
  [10, 0, "room-studio-b", 15, 15, 2, "completed", 2],
  [11, 1, "room-hotdesk-1", 14, 17, 3, "completed", 3],
  [12, 1, "room-meeting-a", 13, 14, 2, "completed", 5],
  [13, 0, "room-studio-a", 12, 16, 2, "completed", 5],
  [14, 1, "room-hotdesk-2", 11, 18, 2, "completed", 2],
  [15, 2, "room-cafe-tables", 10, 15, 1, "completed", 5],
  [16, 1, "room-meeting-b", 9, 14, 2, "completed", 4],
  [17, 0, "room-studio-b", 8, 17, 2, "completed", 2],
  [0, 1, "room-hotdesk-1", 7, 15, 3, "completed", 5],
  [1, 0, "room-studio-a", 6, 16, 2, "completed", 5],
  [2, 2, "room-cafe-tables", 5, 10, 1, "completed", 3],
  [3, 1, "room-meeting-a", 4, 14, 2, "completed", 5],
  [4, 1, "room-hotdesk-2", 3, 17, 2, "completed", 2],
  [5, 0, "room-studio-b", 2, 15, 2, "completed", 4],
  [6, 2, "room-cafe-tables", 1, 16, 1, "completed", 5],
  [7, 1, "room-meeting-b", 0, 14, 2, "checked-in", undefined],
  [8, 0, "room-studio-a", 0, 17, 2, "checked-in", undefined],
  [9, 1, "room-hotdesk-1", -1, 15, 3, "upcoming", undefined],
  [10, 2, "room-cafe-tables", -2, 11, 1, "upcoming", undefined],
  [11, 1, "room-meeting-a", -4, 16, 2, "upcoming", undefined],
  [12, 0, "room-studio-b", 9, 9, 2, "completed", 3],
  [13, 1, "room-hotdesk-2", 13, 19, 2, "completed", 2],
  [14, 1, "room-meeting-b", 18, 20, 2, "completed", 4],
  [15, 0, "room-studio-a", 21, 21, 1, "cancelled", undefined],
];

export const BOOKINGS: Booking[] = BOOKING_ROWS.map(
  ([customerIdx, zoneIdx, roomId, daysAgo, startHour, durationHours, status, csatRating], i) => {
    const customer = CUSTOMERS[customerIdx];
    const zone = ZONES[zoneIdx];
    const id = `BK${String(i + 1).padStart(3, "0")}`;
    const date = isoDaysAgo(daysAgo);
    const endHour = startHour + durationHours;
    const booking: Booking = {
      id,
      customerId: customer.customerId,
      zoneId: zone.id,
      roomId,
      date,
      startTime: hhmm(startHour),
      endTime: hhmm(endHour),
      amountPaid: zone.hourlyRate * durationHours,
      status,
      qrToken: `SS-${id}-${customer.customerId}`,
      csatRating,
    };
    if (status === "checked-in" || status === "completed") {
      booking.checkInAt = `${date}T${hhmm(startHour)}:00`;
    }
    if (status === "completed") {
      booking.checkOutAt = `${date}T${hhmm(endHour)}:00`;
    }
    return booking;
  }
);

// ---------------------------------------------------------------------------
// Reviews — ~18 mock snippets with deliberately repeated topic keywords
// (wifi, noise/soundproofing, coffee/price, staff, AC/temperature, booking
// app) so topic extraction has real signal, spanning clear positive/
// negative/neutral tones so sentiment scoring has real signal too.
// ---------------------------------------------------------------------------
export const REVIEWS: Review[] = [
  { id: "RV01", customerId: "C001", zoneId: "zone-1-studio", bookingId: "BK001", date: isoDaysAgo(25), text: "The soundproofing in the podcast booth is excellent, no outside noise at all. Great booth for recording.", rating: 5 },
  { id: "RV02", customerId: "C002", zoneId: "zone-3-cafe", bookingId: "BK002", date: isoDaysAgo(24), text: "Coffee here is pretty good but a bit expensive compared to nearby cafes.", rating: 3 },
  { id: "RV03", customerId: "C003", zoneId: "zone-2-coworking", bookingId: "BK003", date: isoDaysAgo(23), text: "Wifi kept dropping during my group study session, really frustrating.", rating: 2 },
  { id: "RV04", customerId: "C004", zoneId: "zone-2-coworking", bookingId: "BK004", date: isoDaysAgo(22), text: "Loved the glass meeting room, staff were friendly and helpful when we needed extra chairs.", rating: 5 },
  { id: "RV05", customerId: "C005", zoneId: "zone-1-studio", bookingId: "BK005", date: isoDaysAgo(21), text: "AC in the studio was too cold, had to ask staff to adjust the temperature twice.", rating: 3 },
  { id: "RV06", customerId: "C006", zoneId: "zone-3-cafe", bookingId: "BK006", date: isoDaysAgo(20), text: "Great energy drinks selection and the staff remembered my order every time. Excellent service.", rating: 5 },
  { id: "RV07", customerId: "C007", zoneId: "zone-2-coworking", bookingId: "BK007", date: isoDaysAgo(19), text: "The booking app is confusing, took me three tries to book a hot desk.", rating: 2 },
  { id: "RV08", customerId: "C008", zoneId: "zone-1-studio", bookingId: "BK008", date: isoDaysAgo(18), text: "Streaming setup with lights and cameras is top notch. Worth the price.", rating: 5 },
  { id: "RV09", customerId: "C009", zoneId: "zone-2-coworking", bookingId: "BK009", date: isoDaysAgo(17), text: "Wifi speed was excellent, uploaded a huge video file with no issues.", rating: 5 },
  { id: "RV10", customerId: "C010", zoneId: "zone-3-cafe", bookingId: "BK010", date: isoDaysAgo(16), text: "Coffee price is a bit high for students, but quality is decent.", rating: 3 },
  { id: "RV11", customerId: "C011", zoneId: "zone-1-studio", bookingId: "BK011", date: isoDaysAgo(15), text: "Noise leaked in from the hallway during our podcast recording, not fully soundproof.", rating: 2 },
  { id: "RV12", customerId: "C012", zoneId: "zone-2-coworking", bookingId: "BK012", date: isoDaysAgo(14), text: "Hot desks were comfortable, but the AC was too warm in the afternoon.", rating: 3 },
  { id: "RV13", customerId: "C013", zoneId: "zone-1-studio", bookingId: "BK013", date: isoDaysAgo(13), text: "Amazing staff, helped set up our streaming gear quickly. Highly recommend.", rating: 5 },
  { id: "RV14", customerId: "C014", zoneId: "zone-2-coworking", bookingId: "BK014", date: isoDaysAgo(12), text: "Booking process online was smooth and fast, loved the instant confirmation.", rating: 5 },
  { id: "RV15", customerId: "C015", zoneId: "zone-3-cafe", bookingId: "BK015", date: isoDaysAgo(11), text: "Wifi in the cafe area is weak, hard to work from here.", rating: 2 },
  { id: "RV16", customerId: "C016", zoneId: "zone-2-coworking", bookingId: "BK016", date: isoDaysAgo(10), text: "Meeting room was clean and quiet, exactly what we needed for our group project.", rating: 4 },
  { id: "RV17", customerId: "C017", zoneId: "zone-1-studio", bookingId: "BK017", date: isoDaysAgo(9), text: "Great value for the price, cameras and lighting were professional grade.", rating: 5 },
  { id: "RV18", customerId: "C018", zoneId: "zone-3-cafe", bookingId: "BK018", date: isoDaysAgo(8), text: "Staff were rude when I asked about the loyalty stamp program.", rating: 2 },
];

// ---------------------------------------------------------------------------
// LINE OA notifications — believable click -> check-in conversion funnel:
// 10 broadcast coupons, 4 clicked (~40%), 2 of those led to check-in (~50%).
// ---------------------------------------------------------------------------
export const NOTIFICATIONS: LineNotification[] = [
  { id: "N01", customerId: "C001", kind: "booking-confirmation", message: "Your booking for Podcast Booth A is confirmed for today.", createdAt: `${isoDaysAgo(25)}T09:00:00` },
  { id: "N02", customerId: "C002", kind: "broadcast-coupon", message: "20% off Creator Cafe drinks this week!", createdAt: `${isoDaysAgo(24)}T08:00:00`, clickedCoupon: true, ledToCheckIn: true },
  { id: "N03", customerId: "C003", kind: "booking-confirmation", message: "Your Hot Desk Cluster 1 booking is confirmed.", createdAt: `${isoDaysAgo(23)}T09:30:00` },
  { id: "N04", customerId: "C004", kind: "loyalty-stamp", message: "You earned a Cafe loyalty stamp! 3/8 collected.", createdAt: `${isoDaysAgo(22)}T15:00:00` },
  { id: "N05", customerId: "C005", kind: "broadcast-coupon", message: "Free upgrade to Studio B this weekend, tap to claim!", createdAt: `${isoDaysAgo(21)}T08:00:00`, clickedCoupon: false },
  { id: "N06", customerId: "C006", kind: "booking-confirmation", message: "Your Cafe table reservation is confirmed.", createdAt: `${isoDaysAgo(20)}T14:00:00` },
  { id: "N07", customerId: "C007", kind: "broadcast-coupon", message: "15% off Meeting Rooms booked before 5pm.", createdAt: `${isoDaysAgo(19)}T08:00:00`, clickedCoupon: true, ledToCheckIn: false },
  { id: "N08", customerId: "C008", kind: "loyalty-stamp", message: "You earned a Cafe loyalty stamp! 6/8 collected.", createdAt: `${isoDaysAgo(18)}T18:00:00` },
  { id: "N09", customerId: "C009", kind: "booking-confirmation", message: "Your Meeting Room B booking is confirmed.", createdAt: `${isoDaysAgo(17)}T09:00:00` },
  { id: "N10", customerId: "C010", kind: "broadcast-coupon", message: "Buy 1 Get 1 energy drinks, this weekend only!", createdAt: `${isoDaysAgo(16)}T08:00:00`, clickedCoupon: false },
  { id: "N11", customerId: "C011", kind: "booking-confirmation", message: "Your Podcast Booth A booking is confirmed.", createdAt: `${isoDaysAgo(15)}T09:00:00` },
  { id: "N12", customerId: "C012", kind: "broadcast-coupon", message: "10% off your next Hot Desk booking.", createdAt: `${isoDaysAgo(14)}T08:00:00`, clickedCoupon: true, ledToCheckIn: true },
  { id: "N13", customerId: "C013", kind: "loyalty-stamp", message: "You earned a Cafe loyalty stamp! 8/8 collected — reward unlocked!", createdAt: `${isoDaysAgo(13)}T17:00:00` },
  { id: "N14", customerId: "C014", kind: "booking-confirmation", message: "Your Meeting Room A booking is confirmed.", createdAt: `${isoDaysAgo(12)}T09:00:00` },
  { id: "N15", customerId: "C015", kind: "broadcast-coupon", message: "Free snack with any Cafe drink purchase today.", createdAt: `${isoDaysAgo(11)}T08:00:00`, clickedCoupon: false },
  { id: "N16", customerId: "C016", kind: "booking-confirmation", message: "Your Meeting Room B booking is confirmed.", createdAt: `${isoDaysAgo(10)}T09:00:00` },
  { id: "N17", customerId: "C017", kind: "broadcast-coupon", message: "Studio streaming package, 20% off this month.", createdAt: `${isoDaysAgo(9)}T08:00:00`, clickedCoupon: true, ledToCheckIn: false },
  { id: "N18", customerId: "C018", kind: "loyalty-stamp", message: "You earned a Cafe loyalty stamp! 2/8 collected.", createdAt: `${isoDaysAgo(8)}T16:00:00` },
  { id: "N19", customerId: "C001", kind: "broadcast-coupon", message: "Weekday morning special, 15% off Hot Desks.", createdAt: `${isoDaysAgo(7)}T08:00:00`, clickedCoupon: false },
  { id: "N20", customerId: "C002", kind: "booking-confirmation", message: "Your Podcast Booth A booking is confirmed.", createdAt: `${isoDaysAgo(6)}T09:00:00` },
  { id: "N21", customerId: "C007", kind: "broadcast-coupon", message: "Referral bonus: bring a friend, get 10% off.", createdAt: `${isoDaysAgo(4)}T08:00:00`, clickedCoupon: false },
  { id: "N22", customerId: "C013", kind: "broadcast-coupon", message: "Members-only: free coffee upgrade this week.", createdAt: `${isoDaysAgo(3)}T08:00:00`, clickedCoupon: false },
  { id: "N23", customerId: "C008", kind: "booking-confirmation", message: "Your Podcast Booth A check-in is confirmed — enjoy your session!", createdAt: `${isoDaysAgo(0)}T17:00:00` },
  { id: "N24", customerId: "C007", kind: "booking-confirmation", message: "Your Meeting Room B check-in is confirmed — enjoy your session!", createdAt: `${isoDaysAgo(0)}T14:00:00` },
];
