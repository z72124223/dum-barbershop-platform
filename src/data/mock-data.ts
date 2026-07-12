import type { Booking, Branch, Customer, Service, StaffMember } from "@/domain/models";

export const branch: Branch = {
  id: "branch-taipei-01",
  name: "DUM BARBERSHOP — Mock Studio",
  timezone: "Asia/Taipei",
  address: "台北市黑鋼路 18 號（虛構地址）",
  phone: "02-0000-0018"
};

export const services: Service[] = [
  { id: "svc-signature", name: "DUM SIGNATURE CUT", category: "cut", description: "輪廓診斷、洗髮與俐落造型的完整假資料服務。", durationMinutes: 60, priceLabel: "Mock NT$ 1,200", active: true },
  { id: "svc-fade", name: "SKIN FADE", category: "cut", description: "乾淨漸層與線條修整，適合追求明確輪廓。", durationMinutes: 75, priceLabel: "Mock NT$ 1,500", active: true },
  { id: "svc-shave", name: "HOT TOWEL SHAVE", category: "shave", description: "熱毛巾、修面與鬍型整理的儀式感體驗。", durationMinutes: 45, priceLabel: "Mock NT$ 900", active: true },
  { id: "svc-texture", name: "TEXTURE PERM", category: "perm", description: "以紋理與日常整理性為主的虛構燙髮服務。", durationMinutes: 150, priceLabel: "Mock NT$ 3,600 起", active: true },
  { id: "svc-color", name: "DARK TONE COLOR", category: "color", description: "低彩度、深色系的虛構染髮提案。", durationMinutes: 120, priceLabel: "Mock NT$ 3,000 起", active: true },
  { id: "svc-combo", name: "CUT + SHAVE RITUAL", category: "combo", description: "剪髮、修面與完整整理的組合體驗。", durationMinutes: 105, priceLabel: "Mock NT$ 1,900", active: true }
];

export const staff: StaffMember[] = [
  { id: "staff-ash", branchIds: [branch.id], displayName: "ASH LIN", role: "owner", title: "Founder Barber", specialties: ["Skin Fade", "Classic Crop"], serviceIds: services.map((item) => item.id), active: true },
  { id: "staff-kai", branchIds: [branch.id], displayName: "KAI WU", role: "barber", title: "Senior Barber", specialties: ["Texture", "Modern Mullet"], serviceIds: ["svc-signature", "svc-fade", "svc-texture", "svc-color"], active: true },
  { id: "staff-ren", branchIds: [branch.id], displayName: "REN CHAO", role: "barber", title: "Barber", specialties: ["Hot Towel Shave", "Side Part"], serviceIds: ["svc-signature", "svc-shave", "svc-combo"], active: true }
];

export const customers: Customer[] = [
  { id: "customer-noah", name: "Noah Chen（虛構）", phoneMasked: "09•• ••• 112", preferredStaffId: "staff-ash", lastVisitAt: "2026-07-03T11:00:00+08:00", notes: ["側邊避免過短", "頂部保留紋理"] },
  { id: "customer-milo", name: "Milo Tsai（虛構）", phoneMasked: "09•• ••• 308", preferredStaffId: "staff-kai", lastVisitAt: "2026-06-21T15:30:00+08:00", notes: ["偏好低調造型"] },
  { id: "customer-evan", name: "Evan Lu（虛構）", phoneMasked: "09•• ••• 527", preferredStaffId: "staff-ren", lastVisitAt: "2026-05-28T13:00:00+08:00", notes: ["修面前確認肌膚狀況"] }
];

export const initialBookings: Booking[] = [
  { id: "booking-101", branchId: branch.id, staffId: "staff-ash", serviceId: "svc-signature", customerId: "customer-noah", startsAt: "2026-07-12T10:00:00+08:00", endsAt: "2026-07-12T11:00:00+08:00", status: "completed", depositStatus: "not_required" },
  { id: "booking-102", branchId: branch.id, staffId: "staff-kai", serviceId: "svc-texture", customerId: "customer-milo", startsAt: "2026-07-12T11:30:00+08:00", endsAt: "2026-07-12T14:00:00+08:00", status: "in_service", depositStatus: "unpaid" },
  { id: "booking-103", branchId: branch.id, staffId: "staff-ren", serviceId: "svc-combo", customerId: "customer-evan", startsAt: "2026-07-12T14:30:00+08:00", endsAt: "2026-07-12T16:15:00+08:00", status: "confirmed", depositStatus: "paid", note: "Mock 訂金狀態，未發生真實付款。" },
  { id: "booking-104", branchId: branch.id, staffId: "staff-ash", serviceId: "svc-fade", customerId: "customer-milo", startsAt: "2026-07-12T16:30:00+08:00", endsAt: "2026-07-12T17:45:00+08:00", status: "confirmed", depositStatus: "not_required" }
];

export const timeSlots = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00"];

export function serviceById(id: string) { return services.find((item) => item.id === id); }
export function staffById(id: string) { return staff.find((item) => item.id === id); }
export function customerById(id: string) { return customers.find((item) => item.id === id); }
