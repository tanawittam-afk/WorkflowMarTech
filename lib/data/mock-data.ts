import type {
  Beverage,
  BeverageOrder,
  Booking,
  BundleRule,
  Customer,
  LineNotification,
  OrderLine,
  Review,
  Room,
  Zone,
} from "./types";

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
// Customers — 18 hand-authored records, all 9 required fields + LINE UID
// (the CDP's cross-touchpoint primary key per the MarTech brief).
// Income bands deliberately wide (students ~5-9.5k THB, freelancers
// ~28-80k THB) so K-Means clustering on age+income has real signal.
// ---------------------------------------------------------------------------
export const CUSTOMERS: Customer[] = [
  { customerId: "C001", lineUid: "U1f2a8c31", name: "Natthaphong Srisawat", gender: "Male", age: 21, address: "Chatuchak, Bangkok", occupation: "Students", income: 8000, phoneNumber: "081-234-5671", email: "natthaphong.s@example.com" },
  { customerId: "C002", lineUid: "U2b9d1e42", name: "Chidchanok Boonmee", gender: "Female", age: 23, address: "Thonglor, Bangkok", occupation: "Freelancers", income: 42000, phoneNumber: "089-234-5672", email: "chidchanok.b@example.com" },
  { customerId: "C003", lineUid: "U3c4f7a53", name: "Kittipong Wattana", gender: "Male", age: 20, address: "Ramkhamhaeng, Bangkok", occupation: "Students", income: 6000, phoneNumber: "086-234-5673", email: "kittipong.w@example.com" },
  { customerId: "C004", lineUid: "U4d8e2b64", name: "Supaporn Chaiyasit", gender: "Female", age: 27, address: "Ari, Bangkok", occupation: "Freelancers", income: 58000, phoneNumber: "082-234-5674", email: "supaporn.c@example.com" },
  { customerId: "C005", lineUid: "U5e1c9f75", name: "Anucha Phromsri", gender: "Male", age: 19, address: "Ramkhamhaeng, Bangkok", occupation: "Students", income: 5500, phoneNumber: "084-234-5675", email: "anucha.p@example.com" },
  { customerId: "C006", lineUid: "U6f5a3d86", name: "Waraporn Ketkaew", gender: "Female", age: 25, address: "Thonglor, Bangkok", occupation: "Freelancers", income: 35000, phoneNumber: "087-234-5676", email: "waraporn.k@example.com" },
  { customerId: "C007", lineUid: "U7a6b4e97", name: "Thanakorn Rungrueang", gender: "Male", age: 22, address: "Chatuchak, Bangkok", occupation: "Students", income: 9000, phoneNumber: "083-234-5677", email: "thanakorn.r@example.com" },
  { customerId: "C008", lineUid: "U8b7c5fa8", name: "Ratchanok Intharaphan", gender: "Female", age: 30, address: "Ari, Bangkok", occupation: "Freelancers", income: 72000, phoneNumber: "088-234-5678", email: "ratchanok.i@example.com" },
  { customerId: "C009", lineUid: "U9c8d6ab9", name: "Pornchai Suksawat", gender: "Male", age: 24, address: "Thonglor, Bangkok", occupation: "Freelancers", income: 28000, phoneNumber: "081-345-6789", email: "pornchai.s@example.com" },
  { customerId: "C010", lineUid: "Uad9e7bc0", name: "Napaporn Thongdee", gender: "Female", age: 20, address: "Ramkhamhaeng, Bangkok", occupation: "Students", income: 7000, phoneNumber: "089-345-6780", email: "napaporn.t@example.com" },
  { customerId: "C011", lineUid: "Ube0f8cd1", name: "Ekachai Yodkaew", gender: "Male", age: 33, address: "Ari, Bangkok", occupation: "Freelancers", income: 65000, phoneNumber: "086-345-6781", email: "ekachai.y@example.com" },
  { customerId: "C012", lineUid: "Ucf1a9de2", name: "Siriporn Boonrod", gender: "Female", age: 21, address: "Chatuchak, Bangkok", occupation: "Students", income: 8500, phoneNumber: "082-345-6782", email: "siriporn.b@example.com" },
  { customerId: "C013", lineUid: "Ud02babf3", name: "Wichai Saengthong", gender: "Male", age: 29, address: "Thonglor, Bangkok", occupation: "Freelancers", income: 48000, phoneNumber: "084-345-6783", email: "wichai.s@example.com" },
  { customerId: "C014", lineUid: "Ue13cbc04", name: "Malee Rattanakosin", gender: "Female", age: 22, address: "Ramkhamhaeng, Bangkok", occupation: "Students", income: 6500, phoneNumber: "087-345-6784", email: "malee.r@example.com" },
  { customerId: "C015", lineUid: "Uf24dcd15", name: "Somchai Tanawat", gender: "Male", age: 26, address: "Ari, Bangkok", occupation: "Freelancers", income: 51000, phoneNumber: "083-345-6785", email: "somchai.t@example.com" },
  { customerId: "C016", lineUid: "U035ede26", name: "Kanokwan Phueng", gender: "Female", age: 19, address: "Chatuchak, Bangkok", occupation: "Students", income: 5000, phoneNumber: "088-345-6786", email: "kanokwan.p@example.com" },
  { customerId: "C017", lineUid: "U146fef37", name: "Decha Isarapong", gender: "Male", age: 31, address: "Thonglor, Bangkok", occupation: "Freelancers", income: 80000, phoneNumber: "081-456-7891", email: "decha.i@example.com" },
  { customerId: "C018", lineUid: "U257f0a48", name: "Ploenpit Wongsawan", gender: "Female", age: 23, address: "Ramkhamhaeng, Bangkok", occupation: "Students", income: 9500, phoneNumber: "089-456-7892", email: "ploenpit.w@example.com" },
];

// ---------------------------------------------------------------------------
// Zones & Rooms — the MarTech brief's 3 room sizes, 20 rooms total.
// Small = desk + chairs + WiFi; Medium = + writable Smart TV;
// Large = + conference mic & speakers.
// ---------------------------------------------------------------------------
export const ZONES: Zone[] = [
  {
    id: "zone-small",
    name: "Study Pod — Small Room",
    shortName: "Small",
    description: "Cozy 5-seat pods for study groups and focused work sessions.",
    hourlyRate: 300,
    capacity: 5,
    amenities: ["Work desk & chairs", "High-speed WiFi", "Power outlets"],
  },
  {
    id: "zone-medium",
    name: "Smart Meeting — Medium Room",
    shortName: "Medium",
    description: "10-seat meeting rooms with a writable Smart TV for workshops.",
    hourlyRate: 500,
    capacity: 10,
    amenities: ["Work desk & chairs", "High-speed WiFi", "Writable Smart TV"],
  },
  {
    id: "zone-large",
    name: "Conference Suite — Large Room",
    shortName: "Large",
    description: "15-20 seat suites with Smart TV, microphones, and speakers — full conference feel.",
    hourlyRate: 1000,
    capacity: 20,
    amenities: ["Work desk & chairs", "High-speed WiFi", "Writable Smart TV", "Conference mics & speakers"],
  },
];

export const ROOMS: Room[] = [
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `room-pod-${i + 1}`,
    zoneId: "zone-small" as const,
    name: `Study Pod ${i + 1}`,
    capacity: 5,
    isBookable: true,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `room-meeting-${String.fromCharCode(97 + i)}`,
    zoneId: "zone-medium" as const,
    name: `Meeting Room ${String.fromCharCode(65 + i)}`,
    capacity: 10,
    isBookable: true,
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `room-suite-${i + 1}`,
    zoneId: "zone-large" as const,
    name: `Conference Suite ${i + 1}`,
    capacity: 20,
    isBookable: true,
  })),
];

// ---------------------------------------------------------------------------
// Beverage catalog — Thai menu names by design (rest of the UI is English).
// Ordered in-room via QR, paid post-hoc at checkout ("Teenoi-style" bill).
// ---------------------------------------------------------------------------
export const BEVERAGES: Beverage[] = [
  { id: "boba", name: "ชานมไข่มุก", price: 45 },
  { id: "matcha", name: "มัทฉะลาเต้เย็น", price: 60 },
  { id: "cocoa", name: "โกโก้เย็น", price: 50 },
  { id: "americano", name: "อเมริกาโน่เย็น", price: 65 },
  { id: "latte", name: "คาเฟ่ลาเต้", price: 75 },
  { id: "coffeeset", name: "ชุดกาแฟพรีเมียม (4 แก้ว)", price: 260 },
  { id: "energy", name: "Energy Drink", price: 50 },
  { id: "water", name: "น้ำเปล่า", price: 15 },
];

// Persona menus used by the seed generator below.
const STUDENT_BEVS = ["boba", "matcha", "cocoa", "water"];
const FREELANCER_BEVS = ["americano", "latte", "coffeeset", "energy", "water"];

// ---------------------------------------------------------------------------
// Simulated Apriori association rules → Smart Bundling (marketing activates
// a rule; the booking-confirm page then offers the paired drink at -15%).
// ---------------------------------------------------------------------------
export const BUNDLE_RULES: BundleRule[] = [
  {
    id: "rule-medium-coffeeset",
    zoneId: "zone-medium",
    hourFrom: 9,
    hourTo: 15,
    bevId: "coffeeset",
    lift: 3.1,
    confidence: 68,
    pitch: "Daytime meeting bookings strongly co-occur with the Premium Coffee Set.",
  },
  {
    id: "rule-large-energy",
    zoneId: "zone-large",
    hourFrom: 13,
    hourTo: 19,
    bevId: "energy",
    lift: 2.7,
    confidence: 61,
    pitch: "Afternoon conference sessions co-occur with Energy Drink orders.",
  },
  {
    id: "rule-small-boba",
    zoneId: "zone-small",
    hourFrom: 16,
    hourTo: 21,
    bevId: "boba",
    lift: 2.2,
    confidence: 57,
    pitch: "Evening study pods (student groups) co-occur with boba milk tea pairs.",
  },
];

export const BUNDLE_DISCOUNT = 0.15; // -15% on the bundled beverage
export const WINBACK_DISCOUNT = 0.15; // -15% room fee via win-back coupon

// ---------------------------------------------------------------------------
// Seeded history generator — fact_bookings + fact_billings.
// Deterministic (mulberry32) so server prerender and client hydration agree.
// Students book small rooms evenings; freelancers book medium/large daytime.
// Churn story: C005, C008, C013, C017 have not booked for >30 days (their
// last-30d count is 0 while 31-60d has visits → churn.ts scores them High).
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  let t0 = seed;
  return function () {
    let t = (t0 += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Per-customer visit pattern: [recencyDays, visits90d, baseStartHour, attachProb]
// Index-aligned with CUSTOMERS. recency 0 = checked-in today.
const VISIT_SPECS: Array<[number, number, number, number]> = [
  [2, 5, 17, 0.24], // C001 student
  [0, 5, 10, 0.34], // C002 freelancer — checked-in today
  [4, 4, 18, 0.24], // C003 student
  [3, 5, 11, 0.34], // C004 freelancer
  [34, 3, 17, 0.24], // C005 student — CHURN
  [6, 4, 13, 0.34], // C006 freelancer
  [0, 5, 17, 0.24], // C007 student — checked-in today
  [32, 6, 10, 0.38], // C008 freelancer VIP (large rooms) — CHURN
  [8, 4, 14, 0.34], // C009 freelancer
  [5, 5, 16, 0.24], // C010 student
  [7, 4, 9, 0.38], // C011 freelancer VIP (large rooms)
  [3, 6, 18, 0.24], // C012 student
  [36, 5, 11, 0.34], // C013 freelancer — CHURN
  [9, 4, 17, 0.24], // C014 student
  [11, 3, 15, 0.34], // C015 freelancer
  [13, 3, 19, 0.24], // C016 student
  [33, 5, 10, 0.38], // C017 freelancer VIP (large rooms) — CHURN
  [6, 4, 18, 0.24], // C018 student
];

const LARGE_ROOM_CUSTOMERS = new Set(["C008", "C011", "C017"]);

// CSAT cycles: churn customers trend low (adds +2 risk via avgCsat<=3).
const CSAT_GOOD: Array<1 | 2 | 3 | 4 | 5> = [5, 4, 5, 3, 5, 4];
const CSAT_CHURN: Array<1 | 2 | 3 | 4 | 5> = [3, 2, 3, 4, 2];
const CHURN_IDS = new Set(["C005", "C008", "C013", "C017"]);

function generateSeed(): { bookings: Booking[]; orders: BeverageOrder[] } {
  const rng = mulberry32(20260706);
  const bookings: Booking[] = [];
  const orders: BeverageOrder[] = [];
  let bookingSeq = 1;
  let orderSeq = 1;
  const bevById = new Map(BEVERAGES.map((b) => [b.id, b]));

  CUSTOMERS.forEach((customer, idx) => {
    const [recency, visits, baseHour, attachProb] = VISIT_SPECS[idx];
    const isStudent = customer.occupation === "Students";
    const span = 84 - recency;

    for (let k = 0; k < visits; k++) {
      const daysAgo = k === 0 ? recency : recency + Math.round((k * span) / visits + rng() * 5);
      const startHour = Math.min(20, Math.max(9, baseHour + Math.floor(rng() * 3) - 1));
      const duration = isStudent ? 2 + Math.floor(rng() * 2) : 2 + Math.floor(rng() * 3);

      let zoneIdx: number;
      let roomId: string;
      if (isStudent) {
        zoneIdx = 0;
        roomId = `room-pod-${1 + Math.floor(rng() * 10)}`;
      } else if (LARGE_ROOM_CUSTOMERS.has(customer.customerId)) {
        zoneIdx = rng() < 0.7 ? 2 : 1;
        roomId = zoneIdx === 2 ? `room-suite-${1 + Math.floor(rng() * 4)}` : `room-meeting-${String.fromCharCode(97 + Math.floor(rng() * 6))}`;
      } else {
        zoneIdx = 1;
        roomId = `room-meeting-${String.fromCharCode(97 + Math.floor(rng() * 6))}`;
      }
      const zone = ZONES[zoneIdx];

      const id = `BK${String(bookingSeq++).padStart(3, "0")}`;
      const date = isoDaysAgo(daysAgo);
      const status: Booking["status"] = daysAgo === 0 ? "checked-in" : "completed";
      const csatCycle = CHURN_IDS.has(customer.customerId) ? CSAT_CHURN : CSAT_GOOD;
      const booking: Booking = {
        id,
        customerId: customer.customerId,
        zoneId: zone.id,
        roomId,
        date,
        startTime: hhmm(startHour),
        endTime: hhmm(startHour + duration),
        amountPaid: zone.hourlyRate * duration,
        status,
        qrToken: `SS-${id}-${customer.customerId}`,
        csatRating: status === "completed" ? csatCycle[k % csatCycle.length] : undefined,
      };
      if (status === "checked-in" || status === "completed") {
        booking.checkInAt = `${date}T${hhmm(startHour)}:00`;
      }
      if (status === "completed") {
        booking.checkOutAt = `${date}T${hhmm(startHour + duration)}:00`;
      }
      bookings.push(booking);

      // fact_billings — in-room QR beverage orders (post-paid round 2).
      if (rng() < attachProb) {
        const pool = isStudent ? STUDENT_BEVS : FREELANCER_BEVS;
        const lineCount = 1 + Math.floor(rng() * 2);
        const lines: OrderLine[] = [];
        for (let l = 0; l < lineCount; l++) {
          const bev = bevById.get(pool[Math.floor(rng() * pool.length)])!;
          const qty = bev.id === "coffeeset" ? 1 : 1 + Math.floor(rng() * 2);
          const existing = lines.find((x) => x.bevId === bev.id);
          if (existing) existing.qty += qty;
          else lines.push({ bevId: bev.id, qty, unitPrice: bev.price });
        }
        orders.push({
          id: `OR${String(orderSeq++).padStart(3, "0")}`,
          bookingId: id,
          customerId: customer.customerId,
          lines,
          amount: lines.reduce((s, l) => s + l.unitPrice * l.qty, 0),
          createdAt: `${date}T${hhmm(startHour, 30)}:00`,
        });
      }
    }
  });

  // A few upcoming bookings + one cancellation for UI variety.
  const extras: Array<[string, number, string, number, number, number, Booking["status"]]> = [
    ["C010", 0, "room-pod-3", -1, 16, 2, "upcoming"],
    ["C004", 1, "room-meeting-b", -2, 11, 2, "upcoming"],
    ["C011", 2, "room-suite-2", -4, 9, 3, "upcoming"],
    ["C015", 1, "room-meeting-d", 20, 15, 2, "cancelled"],
  ];
  for (const [customerId, zoneIdx, roomId, daysAgo, startHour, duration, status] of extras) {
    const zone = ZONES[zoneIdx];
    const id = `BK${String(bookingSeq++).padStart(3, "0")}`;
    bookings.push({
      id,
      customerId,
      zoneId: zone.id,
      roomId,
      date: isoDaysAgo(daysAgo),
      startTime: hhmm(startHour),
      endTime: hhmm(startHour + duration),
      amountPaid: zone.hourlyRate * duration,
      status,
      qrToken: `SS-${id}-${customerId}`,
    });
  }

  return { bookings, orders };
}

const SEED = generateSeed();
export const BOOKINGS: Booking[] = SEED.bookings;
export const BEVERAGE_ORDERS: BeverageOrder[] = SEED.orders;

// ---------------------------------------------------------------------------
// Pre-CDP baselines for the 3 SMART goal progress bars. Derived from the
// seeded "current" metrics so the bars always start mid-story: history
// already shows +6.2% revenue / +5.2% AOV since CDP launch, and the
// pre-CDP beverage attach rate was 22%.
// ---------------------------------------------------------------------------
function seedMetrics() {
  const cutoff = isoDaysAgo(30);
  const orderByBooking = new Map(BEVERAGE_ORDERS.map((o) => [o.bookingId, o] as const));
  const bevByBooking = new Map<string, number>();
  for (const o of BEVERAGE_ORDERS) {
    bevByBooking.set(o.bookingId, (bevByBooking.get(o.bookingId) ?? 0) + o.amount);
  }
  const b30 = BOOKINGS.filter((b) => b.status !== "cancelled" && b.date >= cutoff && b.date <= TODAY_ISO);
  const roomRev = b30.reduce((s, b) => s + b.amountPaid, 0);
  const bevRev = b30.reduce((s, b) => s + (bevByBooking.get(b.id) ?? 0), 0);
  const attach = b30.length ? (b30.filter((b) => orderByBooking.has(b.id)).length / b30.length) * 100 : 0;
  const aov = b30.length ? (roomRev + bevRev) / b30.length : 0;
  return { roomRev, attach, aov };
}

const M0 = seedMetrics();
export const BASELINES = {
  revenue30: Math.round(M0.roomRev / 1.062),
  attachRate: 22,
  aov: Math.round(M0.aov / 1.052),
};

// ---------------------------------------------------------------------------
// Reviews — ~18 mock snippets with deliberately repeated topic keywords
// (wifi, smart tv, mic/speakers, coffee/drinks & QR ordering, staff,
// AC/temperature, booking app) so topic extraction has real signal, spanning
// clear positive/negative/neutral tones for sentiment scoring.
// ---------------------------------------------------------------------------
export const REVIEWS: Review[] = [
  { id: "RV01", customerId: "C001", zoneId: "zone-small", date: isoDaysAgo(25), text: "The study pod was quiet and the wifi speed is excellent. Great spot before exams.", rating: 5 },
  { id: "RV02", customerId: "C002", zoneId: "zone-medium", date: isoDaysAgo(24), text: "Coffee from the QR menu is pretty good but a bit expensive compared to nearby cafes.", rating: 3 },
  { id: "RV03", customerId: "C003", zoneId: "zone-small", date: isoDaysAgo(23), text: "Wifi kept dropping during my group study session, really frustrating.", rating: 2 },
  { id: "RV04", customerId: "C004", zoneId: "zone-medium", date: isoDaysAgo(22), text: "Loved the writable Smart TV in the meeting room, staff were friendly and helpful.", rating: 5 },
  { id: "RV05", customerId: "C005", zoneId: "zone-small", date: isoDaysAgo(34), text: "AC in the pod was too cold, had to ask staff to adjust the temperature twice.", rating: 3 },
  { id: "RV06", customerId: "C006", zoneId: "zone-medium", date: isoDaysAgo(20), text: "Ordered drinks by scanning the QR code and they arrived fast. Excellent service.", rating: 5 },
  { id: "RV07", customerId: "C007", zoneId: "zone-small", date: isoDaysAgo(19), text: "The booking app is confusing, took me three tries to book a study pod.", rating: 2 },
  { id: "RV08", customerId: "C008", zoneId: "zone-large", date: isoDaysAgo(35), text: "Conference mics and speakers are top notch. Worth the price for client meetings.", rating: 5 },
  { id: "RV09", customerId: "C009", zoneId: "zone-medium", date: isoDaysAgo(17), text: "Wifi speed was excellent, uploaded a huge video file with no issues.", rating: 5 },
  { id: "RV10", customerId: "C010", zoneId: "zone-small", date: isoDaysAgo(16), text: "Boba milk tea price is a bit high for students, but quality is decent.", rating: 3 },
  { id: "RV11", customerId: "C011", zoneId: "zone-large", date: isoDaysAgo(15), text: "Noise leaked in from the hallway during our conference call, not fully soundproof.", rating: 2 },
  { id: "RV12", customerId: "C012", zoneId: "zone-small", date: isoDaysAgo(14), text: "Pods are comfortable, but the AC was too warm in the afternoon.", rating: 3 },
  { id: "RV13", customerId: "C013", zoneId: "zone-medium", date: isoDaysAgo(37), text: "Smart TV markers were dry and the room smelled odd. Disappointing this time.", rating: 2 },
  { id: "RV14", customerId: "C014", zoneId: "zone-small", date: isoDaysAgo(12), text: "Booking process online was smooth and fast, loved the instant confirmation.", rating: 5 },
  { id: "RV15", customerId: "C015", zoneId: "zone-medium", date: isoDaysAgo(11), text: "Wifi in Meeting Room D is weak, hard to present from the cloud.", rating: 2 },
  { id: "RV16", customerId: "C016", zoneId: "zone-small", date: isoDaysAgo(10), text: "Pod was clean and quiet, exactly what we needed for our group project.", rating: 4 },
  { id: "RV17", customerId: "C017", zoneId: "zone-large", date: isoDaysAgo(33), text: "Great value for the price, the conference suite felt professional grade.", rating: 5 },
  { id: "RV18", customerId: "C018", zoneId: "zone-small", date: isoDaysAgo(8), text: "Staff were rude when I asked about the loyalty stamp program.", rating: 2 },
];

// ---------------------------------------------------------------------------
// LINE OA notifications — believable click -> check-in conversion funnel:
// 10 broadcast coupons, 4 clicked (~40%), 2 of those led to check-in (~50%).
// ---------------------------------------------------------------------------
export const NOTIFICATIONS: LineNotification[] = [
  { id: "N01", customerId: "C001", kind: "booking-confirmation", message: "Your Study Pod booking is confirmed for today.", createdAt: `${isoDaysAgo(25)}T09:00:00` },
  { id: "N02", customerId: "C002", kind: "broadcast-coupon", message: "20% off in-room drinks this week — scan the QR in your room!", createdAt: `${isoDaysAgo(24)}T08:00:00`, clickedCoupon: true, ledToCheckIn: true },
  { id: "N03", customerId: "C003", kind: "booking-confirmation", message: "Your Study Pod 4 booking is confirmed.", createdAt: `${isoDaysAgo(23)}T09:30:00` },
  { id: "N04", customerId: "C004", kind: "loyalty-stamp", message: "You earned a drinks loyalty stamp! 3/8 collected.", createdAt: `${isoDaysAgo(22)}T15:00:00` },
  { id: "N05", customerId: "C005", kind: "broadcast-coupon", message: "Free upgrade to a Conference Suite this weekend, tap to claim!", createdAt: `${isoDaysAgo(21)}T08:00:00`, clickedCoupon: false },
  { id: "N06", customerId: "C006", kind: "booking-confirmation", message: "Your Meeting Room C booking is confirmed.", createdAt: `${isoDaysAgo(20)}T14:00:00` },
  { id: "N07", customerId: "C007", kind: "broadcast-coupon", message: "15% off Meeting Rooms booked before 5pm.", createdAt: `${isoDaysAgo(19)}T08:00:00`, clickedCoupon: true, ledToCheckIn: false },
  { id: "N08", customerId: "C008", kind: "loyalty-stamp", message: "You earned a drinks loyalty stamp! 6/8 collected.", createdAt: `${isoDaysAgo(18)}T18:00:00` },
  { id: "N09", customerId: "C009", kind: "booking-confirmation", message: "Your Meeting Room B booking is confirmed.", createdAt: `${isoDaysAgo(17)}T09:00:00` },
  { id: "N10", customerId: "C010", kind: "broadcast-coupon", message: "Buy 1 Get 1 boba milk tea, this weekend only!", createdAt: `${isoDaysAgo(16)}T08:00:00`, clickedCoupon: false },
  { id: "N11", customerId: "C011", kind: "booking-confirmation", message: "Your Conference Suite 1 booking is confirmed.", createdAt: `${isoDaysAgo(15)}T09:00:00` },
  { id: "N12", customerId: "C012", kind: "broadcast-coupon", message: "10% off your next Study Pod booking.", createdAt: `${isoDaysAgo(14)}T08:00:00`, clickedCoupon: true, ledToCheckIn: true },
  { id: "N13", customerId: "C013", kind: "loyalty-stamp", message: "You earned a drinks loyalty stamp! 8/8 collected — reward unlocked!", createdAt: `${isoDaysAgo(13)}T17:00:00` },
  { id: "N14", customerId: "C014", kind: "booking-confirmation", message: "Your Study Pod 7 booking is confirmed.", createdAt: `${isoDaysAgo(12)}T09:00:00` },
  { id: "N15", customerId: "C015", kind: "broadcast-coupon", message: "Free snack with any in-room drink order today.", createdAt: `${isoDaysAgo(11)}T08:00:00`, clickedCoupon: false },
  { id: "N16", customerId: "C016", kind: "booking-confirmation", message: "Your Study Pod 9 booking is confirmed.", createdAt: `${isoDaysAgo(10)}T09:00:00` },
  { id: "N17", customerId: "C017", kind: "broadcast-coupon", message: "Conference Suite package, 20% off this month.", createdAt: `${isoDaysAgo(9)}T08:00:00`, clickedCoupon: true, ledToCheckIn: false },
  { id: "N18", customerId: "C018", kind: "loyalty-stamp", message: "You earned a drinks loyalty stamp! 2/8 collected.", createdAt: `${isoDaysAgo(8)}T16:00:00` },
  { id: "N19", customerId: "C001", kind: "broadcast-coupon", message: "Weekday morning special, 15% off Study Pods.", createdAt: `${isoDaysAgo(7)}T08:00:00`, clickedCoupon: false },
  { id: "N20", customerId: "C002", kind: "booking-confirmation", message: "Your Meeting Room A booking is confirmed.", createdAt: `${isoDaysAgo(6)}T09:00:00` },
  { id: "N21", customerId: "C007", kind: "broadcast-coupon", message: "Referral bonus: bring a friend, get 10% off.", createdAt: `${isoDaysAgo(4)}T08:00:00`, clickedCoupon: false },
  { id: "N22", customerId: "C013", kind: "broadcast-coupon", message: "Members-only: free coffee upgrade this week.", createdAt: `${isoDaysAgo(3)}T08:00:00`, clickedCoupon: false },
  { id: "N23", customerId: "C008", kind: "booking-confirmation", message: "Your Conference Suite check-in is confirmed — enjoy your session!", createdAt: `${isoDaysAgo(0)}T17:00:00` },
  { id: "N24", customerId: "C007", kind: "booking-confirmation", message: "Your Study Pod check-in is confirmed — enjoy your session!", createdAt: `${isoDaysAgo(0)}T14:00:00` },
];
