import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  phone: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Hotel schema
export const hotels = pgTable("hotels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(), // General location (will keep for backwards compatibility)
  city: text("city"),                   // City ID from turkishCities data
  district: text("district"),           // District ID from turkishCities data
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  stars: integer("stars").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),                 // Her otel için telefon numarası
  amenities: text("amenities").array().notNull(),
  rating: doublePrecision("rating"),
});

export const insertHotelSchema = createInsertSchema(hotels).pick({
  name: true,
  location: true,
  city: true,
  district: true,
  description: true,
  imageUrl: true,
  stars: true,
  address: true,
  phone: true,
  amenities: true,
  rating: true,
});

export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotels.$inferSelect;

// Room schema
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  // price field has been removed - all pricing is handled through dailyPrices and weekdayPrices
  capacity: integer("capacity").notNull(),
  roomCount: integer("room_count").notNull().default(1), // Otelde bu tipten kaç oda olduğu
  imageUrl: text("image_url").notNull(), // Ana resim URL'si
  images: text("images"), // JSON string olarak tüm resimlerin URL'leri
  features: text("features").array().notNull(),
  type: text("type").notNull(),
  dailyPrices: text("daily_prices"), // Optional JSON string for storing daily prices
  weekdayPrices: text("weekday_prices"), // Optional JSON string for storing weekday prices
});

export const insertRoomSchema = createInsertSchema(rooms).pick({
  hotelId: true,
  name: true,
  description: true,
  capacity: true,
  roomCount: true,
  imageUrl: true,
  images: true,
  features: true,
  type: true,
  dailyPrices: true,
  weekdayPrices: true,
});

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;

// Reservation schema
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  roomId: integer("room_id").notNull(),
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out").notNull(),
  numberOfGuests: integer("number_of_guests").notNull(),
  totalPrice: integer("total_price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull().default("on_site"), // "on_site" veya "credit_card"
  paymentStatus: text("payment_status").notNull().default("pending"), // "pending", "paid", "failed"
  paymentId: text("payment_id"),                                    // PayTR işlem referans numarası
  reservationCode: text("reservation_code"),                        // Rezervasyon kodu (örn: VIP12345)
});

// Tarih alanları için özel bir doğrulama şeması oluşturalım
// ISO string formatındaki tarih bilgilerini Date nesnesine çeviriyor
export const insertReservationSchema = createInsertSchema(reservations, {
  checkIn: z.string().transform((val) => new Date(val)),
  checkOut: z.string().transform((val) => new Date(val))
}).pick({
  userId: true,
  roomId: true,
  checkIn: true,
  checkOut: true,
  numberOfGuests: true,
  totalPrice: true,
  paymentMethod: true,
});

export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservations.$inferSelect;

// Theme schema - to store user theme preferences
export const themes = pgTable("themes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  theme: text("theme").notNull().default("classic"),
});

export const insertThemeSchema = createInsertSchema(themes).pick({
  userId: true,
  theme: true,
});

export type InsertTheme = z.infer<typeof insertThemeSchema>;
export type Theme = typeof themes.$inferSelect;

// Otel koşulları - her otel için özel kurallar ve politikalar
export const hotelPolicies = pgTable("hotel_policies", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull().references(() => hotels.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  cancellationPolicy: text("cancellation_policy").notNull(), // Örn: "24_HOURS", "48_HOURS", "NO_REFUND" gibi
  cancellationDays: integer("cancellation_days").notNull().default(1), // İptal politikası için gün sayısı
  checkInTime: text("check_in_time").notNull(), // Örn: "14:00"
  checkOutTime: text("check_out_time").notNull(), // Örn: "12:00"
  childrenPolicy: text("children_policy").notNull(), // Örn: "Ücretsiz/Ücretli" vs.
  petPolicy: text("pet_policy").notNull(), // Örn: "İzin verilmez", "Ücretli", "Ücretsiz" vs.
  extraBedPolicy: text("extra_bed_policy"), // Ek yatak politikası
  extraBedPrice: integer("extra_bed_price"), // Ek yatak varsa fiyatı
  depositRequired: boolean("deposit_required").default(false), // Depozito gerekiyor mu?
  depositAmount: integer("deposit_amount"), // Depozito miktarı (varsa)
  otherRules: text("other_rules").array(), // Diğer kurallar ve politikalar
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertHotelPolicySchema = createInsertSchema(hotelPolicies).pick({
  hotelId: true,
  title: true,
  description: true,
  cancellationPolicy: true,
  cancellationDays: true,
  checkInTime: true,
  checkOutTime: true,
  childrenPolicy: true,
  petPolicy: true,
  extraBedPolicy: true,
  extraBedPrice: true,
  depositRequired: true,
  depositAmount: true,
  otherRules: true,
});

export type InsertHotelPolicy = z.infer<typeof insertHotelPolicySchema>;
export type HotelPolicy = typeof hotelPolicies.$inferSelect;

// Site içerik yönetimi tablosu
export const pageContents = pgTable("page_contents", {
  id: serial("id").primaryKey(),
  pageKey: text("page_key").notNull().unique(), // Sayfanın benzersiz anahtarı (örneğin: 'about_us', 'contact', vb.)
  title: text("title").notNull(),
  content: text("content").notNull(), // JSON formatında içerik (bölümler, değerler, vb.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPageContentSchema = createInsertSchema(pageContents).pick({
  pageKey: true,
  title: true,
  content: true,
});

export type InsertPageContent = z.infer<typeof insertPageContentSchema>;
export type PageContent = typeof pageContents.$inferSelect;

// PayTR ayarları için schema
export const paytrSettings = pgTable("paytr_settings", {
  id: serial("id").primaryKey(),
  merchantId: text("merchant_id").notNull(),
  merchantKey: text("merchant_key").notNull(),
  merchantSalt: text("merchant_salt").notNull(),
  testMode: boolean("test_mode").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPaytrSettingsSchema = createInsertSchema(paytrSettings).pick({
  merchantId: true,
  merchantKey: true,
  merchantSalt: true,
  testMode: true,
});

export type InsertPaytrSettings = z.infer<typeof insertPaytrSettingsSchema>;
export type PaytrSettings = typeof paytrSettings.$inferSelect;

// PayTR işlemleri için logları tutacak schema
export const paytrTransactions = pgTable("paytr_transactions", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").notNull(),
  merchantOid: text("merchant_oid").notNull(),
  amount: integer("amount").notNull(), // Kuruş cinsinden
  token: text("token"),  // PayTR token
  status: text("status").notNull().default("pending"), // pending, success, failed
  requestData: text("request_data"), // Gönderilen veri (JSON string)
  responseData: text("response_data"), // PayTR'den gelen yanıt (JSON string)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPaytrTransactionSchema = createInsertSchema(paytrTransactions).pick({
  reservationId: true,
  merchantOid: true,
  amount: true,
  token: true,
  status: true,
  requestData: true,
  responseData: true,
});

export type InsertPaytrTransaction = z.infer<typeof insertPaytrTransactionSchema>;
export type PaytrTransaction = typeof paytrTransactions.$inferSelect;
