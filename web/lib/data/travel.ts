export type TripStatus = 'booked' | 'planning' | 'proposed';

export type TripItinerary = {
  /** When (e.g. "Apr 22, 6:20a"). */
  t: string;
  /** What (e.g. "SFO → JFK"). */
  a: string;
  /** Detail (e.g. "Delta 402 · seat 3A · confirmation VFX2K7"). */
  b: string;
};

export type FlightOption = {
  carrier: string;
  depart: string;
  price: string;
  recommended: boolean;
};

export type Trip = {
  id: number;
  where: string;
  dates: string;
  purpose: string;
  status: TripStatus;
  cost: number | null;
  progress: string[];
  itinerary?: TripItinerary[];
  flightOptions?: FlightOption[];
};

export const TRIPS: Trip[] = [
  {
    id: 0,
    where: 'New York',
    dates: 'Apr 22 — Apr 25',
    purpose: 'Board dinner + 3 investor meets',
    status: 'booked',
    cost: 1840,
    progress: ['Delta SFO→JFK (seat 3A)', 'Soho Grand — 3 nights', 'Uber credits applied'],
    itinerary: [
      { t: 'Apr 22, 6:20a', a: 'SFO → JFK', b: 'Delta 402 · seat 3A · confirmation VFX2K7' },
      { t: 'Apr 22, 3:40p', a: 'Check in', b: 'Soho Grand · 310 W Broadway · confirmed' },
      { t: 'Apr 23, 9:00a', a: 'Board dinner', b: 'Balthazar · private room · 14 people' },
      { t: 'Apr 24, 2:00p', a: 'Meeting · Sequoia', b: '550 Madison Ave · Anton added to calendar' },
      { t: 'Apr 25, 4:50p', a: 'JFK → SFO', b: 'Delta 415 · seat 7F' },
    ],
  },
  {
    id: 1,
    where: 'Austin',
    dates: 'May 8 — May 11',
    purpose: 'Team offsite',
    status: 'planning',
    cost: null,
    progress: ['Comparing flight options', 'Hotel block held'],
    flightOptions: [
      { carrier: 'United 724', depart: '6:00a', price: '$340', recommended: true },
      { carrier: 'Delta 1104', depart: '9:15a', price: '$380', recommended: false },
      { carrier: 'Southwest', depart: '11:30a', price: '$290', recommended: false },
    ],
  },
  {
    id: 2,
    where: 'London',
    dates: 'Jun — TBD',
    purpose: 'Early-stage summit',
    status: 'proposed',
    cost: null,
    progress: ['3 conference options identified', 'Awaiting your priority call'],
  },
];
