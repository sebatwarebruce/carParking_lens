// One icon per concept. Never use a different icon for the same action (design system section 6).
import {
  LayoutDashboard, LogIn, LogOut, Aperture, ParkingSquare, Timer, ReceiptText, Wallet, Banknote, Smartphone,
  ChartNoAxesColumn, Tags, UsersRound, ScrollText, Settings2, Bell, MapPinned, Car, Bike, Truck, CircleHelp,
  Camera, CircleCheck, CarFront, Wrench, Hourglass, CircleX, BadgeCheck, ShieldCheck, Crown, ClipboardCheck,
  Contact, HandCoins, WifiOff, House, Building2, LifeBuoy, UserRound, Landmark, Ban, Info, TriangleAlert, Activity,
} from 'lucide-react';

export const ICONS = {
  dashboard: LayoutDashboard, home: House, entry: LogIn, exit: LogOut, lens: Aperture, spaces: ParkingSquare,
  sessions: Timer, receipt: ReceiptText, payments: Wallet, cash: Banknote, mobileMoney: Smartphone, card: Landmark,
  reports: ChartNoAxesColumn, pricing: Tags, staff: UsersRound, audit: ScrollText, settings: Settings2,
  notifications: Bell, locations: MapPinned, organizations: Building2, camera: Camera, help: LifeBuoy, profile: UserRound,
  offline: WifiOff, activity: Activity, info: Info, warning: TriangleAlert,
  vehicle: { CAR: Car, MOTORCYCLE: Bike, TRUCK: Truck, OTHER: CircleHelp, ANY: ParkingSquare },
  slot: { AVAILABLE: CircleCheck, OCCUPIED: CarFront, OUT_OF_SERVICE: Wrench },
  payment: { PENDING: Hourglass, SUCCESS: BadgeCheck, FAILED: CircleX, CANCELLED: Ban, REFUNDED: Wallet },
  role: { SUPER_ADMIN: ShieldCheck, PARKING_OWNER: Crown, MANAGER: ClipboardCheck, ATTENDANT: Contact, CASHIER: HandCoins },
};
