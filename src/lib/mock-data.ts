
export interface VehicleSpec {
  seats: string;
  transmission: string;
  fuel: string;
  doors: string;
  year: string;
  mileage: string;
}

export interface Vehicle {
  id: string;
  name: string;
  year: number;
  category: string;
  rating: number;
  trips: number;
  plate: string;
  pricePerDay: number;
  image: string;
  images: string[];
  specs: VehicleSpec;
  features: string[];
  description: string[];
}

export const VEHICLES: Vehicle[] = [
  {
    id: 'jeep-grand-cherokee-2019',
    name: 'Jeep Grand Cherokee',
    year: 2019,
    category: 'Premium SUV',
    rating: 4.9,
    trips: 128,
    plate: 'LEE-67-889A',
    pricePerDay: 88.01,
    image: '/images/car-cherokee.png',
    images: ['/images/car-cherokee.png', '/images/car-santafe.png', '/images/category-luxury.png'],
    specs: {
      seats: '5 people',
      transmission: 'Automatic',
      fuel: 'Petrol',
      doors: '4 doors',
      year: '2019',
      mileage: 'Unlimited',
    },
    features: ['Apple CarPlay', 'Bluetooth', 'Backup camera', 'Heated seats', 'Cruise control'],
    description: [
      "The Jeep Grand Cherokee blends rugged capability with refined comfort, making it equally at home on a snowy mountain road or a smooth highway commute. With seating for five, a spacious cargo area, and a smooth automatic transmission, it's a dependable choice for family getaways, business trips, and everything in between.",
      'This 2019 model is meticulously maintained and detailed before every rental. It comes loaded with Apple CarPlay, Bluetooth, heated seats, a backup camera, and cruise control — plus unlimited mileage so you can explore without worrying about the odometer.',
    ],
  },
  {
    id: 'hyundai-santa-fe-2021',
    name: 'Hyundai Santa Fe',
    year: 2021,
    category: 'Midsize SUV',
    rating: 4.8,
    trips: 96,
    plate: 'CT-22-471B',
    pricePerDay: 74.5,
    image: '/images/car-santafe.png',
    images: ['/images/car-santafe.png', '/images/car-cherokee.png', '/images/category-luxury.png'],
    specs: {
      seats: '5 people',
      transmission: 'Automatic',
      fuel: 'Petrol',
      doors: '4 doors',
      year: '2021',
      mileage: 'Unlimited',
    },
    features: ['Apple CarPlay', 'Android Auto', 'Lane assist', 'Backup camera', 'Bluetooth'],
    description: [
      'The Hyundai Santa Fe is a comfortable, fuel-efficient midsize SUV with generous cargo space and an easy, confident drive — a great pick for weekend trips and airport runs alike.',
      'Loaded with modern driver aids and detailed before every rental, it offers unlimited mileage and a smooth ride for up to five passengers.',
    ],
  },
  {
    id: 'luxury-sedan-2022',
    name: 'Executive Luxury Sedan',
    year: 2022,
    category: 'Luxury',
    rating: 5.0,
    trips: 54,
    plate: 'CT-90-002C',
    pricePerDay: 139.0,
    image: '/images/category-luxury.png',
    images: ['/images/category-luxury.png', '/images/car-cherokee.png', '/images/car-santafe.png'],
    specs: {
      seats: '5 people',
      transmission: 'Automatic',
      fuel: 'Hybrid',
      doors: '4 doors',
      year: '2022',
      mileage: 'Unlimited',
    },
    features: ['Premium audio', 'Heated & cooled seats', 'Apple CarPlay', 'Adaptive cruise', 'Sunroof'],
    description: [
      'Arrive in style. This executive luxury sedan pairs a quiet, refined cabin with premium materials and the latest tech for business travel and special occasions.',
      'Hybrid efficiency, heated and cooled seats, and a long list of comfort features — meticulously detailed before every rental.',
    ],
  },
];

export function getVehicle(id: string): Vehicle | undefined {
  return VEHICLES.find((v) => v.id === id);
}

export interface ProtectionPlan {
  id: string;
  name: string;
  perDay: number;
  desc: string;
  recommended?: boolean;
  covered: [boolean, string][];
}

export const PROTECTION_PLANS: ProtectionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    perDay: 14.99,
    desc: 'Lowest daily rate. You pay up to $1,500 if anything happens to the car.',
    covered: [
      [true, 'Collision damage waiver above $1,500'],
      [true, '24/7 roadside assistance'],
      [false, 'You pay the first $1,500 of any damage'],
      [false, 'Theft & glass not included'],
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    perDay: 29.99,
    desc: 'If something happens, you pay up to $500 — we cover the rest. No paperwork at pickup.',
    recommended: true,
    covered: [
      [true, 'Collision damage waiver above $500'],
      [true, '24/7 roadside assistance'],
      [true, 'Theft protection included'],
      [false, 'Glass & tyres not included'],
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    perDay: 50.99,
    desc: 'Zero deductible. Fully covered including theft, liability and glass.',
    covered: [
      [true, 'Zero deductible — fully covered'],
      [true, 'Theft, liability & third-party'],
      [true, 'Glass, tyres & undercarriage'],
      [true, 'Priority 24/7 roadside assistance'],
    ],
  },
  {
    id: 'own',
    name: 'Own insurance',
    perDay: 0,
    desc: "Bring proof of active coverage to pickup. You're responsible for any damage to the vehicle.",
    covered: [
      [true, 'Use your existing policy'],
      [false, 'Proof of active coverage required at pickup'],
      [false, "You're liable for all damage not covered by your policy"],
    ],
  },
];

export interface Extra {
  id: string;
  name: string;
  desc: string;
  perDay: number;
}

export const EXTRAS: Extra[] = [
  { id: 'driver', name: 'Additional driver', desc: 'Add a second authorized driver', perDay: 50.99 },
  { id: 'seat', name: 'Child safety seat', desc: 'Rear-facing or booster, fitted', perDay: 12.0 },
  { id: 'gps', name: 'GPS navigation', desc: 'Built-in turn-by-turn device', perDay: 9.99 },
];

export const VALID_PROMOS = ['WEEKEND20', 'SAVE10', 'FLEETHQSALE'];
export const PROMO_DISCOUNT_PCT = 10;

export const DEMO_USER = {
  name: 'Zaid Khan',
  email: 'zaid@gmail.com',
  phone: '+1 (321) 213-9874',
};

function tripDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const DEFAULT_TRIP = {
  pickupDate: tripDateOffset(0),
  pickupTime: '09:00',
  returnDate: tripDateOffset(2),
  returnTime: '09:00',
};

export interface BookingExtra {
  name: string;
  perDay: number;
  qty: number;
}

export interface Booking {
  id: string;
  invoiceNo: string;
  vehicleId: string;
  vehicleName: string;
  plate: string;
  vin: string;
  bookedOn: string;
  confirmationEmail: string;
  driver: { name: string; email: string; phone: string };
  pickup: { location: string; date: string; time: string };
  dropoff: { location: string; date: string; time: string };
  days: number;
  pricePerDay: number;
  planName: string;
  planPerDay: number;
  extras: BookingExtra[];
  promoCode: string;
  discountPct: number;
  modificationCharge: number;
}

export const SAMPLE_BOOKING: Booking = {
  id: '13214',
  invoiceNo: '3522',
  vehicleId: 'jeep-grand-cherokee-2019',
  vehicleName: 'Jeep Grand Cherokee',
  plate: 'LEE-67-889A',
  vin: 'Z812AHSD812',
  bookedOn: '21 June 2025',
  confirmationEmail: 'hi@booking.com',
  driver: { ...DEMO_USER },
  pickup: { location: 'Farmington, CT 06034', date: 'Tue, 02 Dec 2025', time: '09:00 AM' },
  dropoff: { location: 'Farmington, CT 06034', date: 'Thu, 04 Dec 2025', time: '09:00 AM' },
  days: 2,
  pricePerDay: 88.01,
  planName: 'Standard Protection',
  planPerDay: 29.99,
  extras: [{ name: 'Child safety seat', perDay: 12.0, qty: 1 }],
  promoCode: 'WEEKEND20',
  discountPct: PROMO_DISCOUNT_PCT,
  modificationCharge: 50.99,
};

export function bookingQuoteInput(b: Booking) {
  return {
    pricePerDay: b.pricePerDay,
    days: b.days,
    plan: { name: b.planName, perDay: b.planPerDay },
    extras: b.extras,
    discount: { code: b.promoCode, pct: b.discountPct },
  };
}

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled';

export interface BookingSummary {
  id: string;
  vehicleId: string;
  vehicleName: string;
  image: string;
  location: string;
  dates: string;
  status: BookingStatus;
  total: number;
}

export const BOOKING_SUMMARIES: BookingSummary[] = [
  {
    id: '13214',
    vehicleId: 'jeep-grand-cherokee-2019',
    vehicleName: 'Jeep Grand Cherokee',
    image: '/images/car-cherokee.png',
    location: 'Farmington, CT',
    dates: 'Tue 02 Dec → Thu 04 Dec 2025',
    status: 'pending',
    total: 242.4,
  },
  {
    id: '13190',
    vehicleId: 'hyundai-santa-fe-2021',
    vehicleName: 'Hyundai Santa Fe',
    image: '/images/car-santafe.png',
    location: 'Bradley Intl Airport (BDL)',
    dates: 'Fri 19 Dec → Mon 22 Dec 2025',
    status: 'confirmed',
    total: 312.5,
  },
  {
    id: '12984',
    vehicleId: 'luxury-sedan-2022',
    vehicleName: 'Executive Luxury Sedan',
    image: '/images/category-luxury.png',
    location: 'Downtown Hartford, CT',
    dates: 'Sat 08 Nov → Sun 09 Nov 2025',
    status: 'cancelled',
    total: 168.0,
  },
];
