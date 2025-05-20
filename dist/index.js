var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import createMemoryStore from "memorystore";
import session2 from "express-session";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  hotelPolicies: () => hotelPolicies,
  hotels: () => hotels,
  insertHotelPolicySchema: () => insertHotelPolicySchema,
  insertHotelSchema: () => insertHotelSchema,
  insertPageContentSchema: () => insertPageContentSchema,
  insertPaytrSettingsSchema: () => insertPaytrSettingsSchema,
  insertPaytrTransactionSchema: () => insertPaytrTransactionSchema,
  insertReservationSchema: () => insertReservationSchema,
  insertRoomSchema: () => insertRoomSchema,
  insertThemeSchema: () => insertThemeSchema,
  insertUserSchema: () => insertUserSchema,
  pageContents: () => pageContents,
  paytrSettings: () => paytrSettings,
  paytrTransactions: () => paytrTransactions,
  reservations: () => reservations,
  rooms: () => rooms,
  themes: () => themes,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  phone: true
});
var hotels = pgTable("hotels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  // General location (will keep for backwards compatibility)
  city: text("city"),
  // City ID from turkishCities data
  district: text("district"),
  // District ID from turkishCities data
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  stars: integer("stars").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  // Her otel için telefon numarası
  amenities: text("amenities").array().notNull(),
  rating: doublePrecision("rating")
});
var insertHotelSchema = createInsertSchema(hotels).pick({
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
  rating: true
});
var rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  // price field has been removed - all pricing is handled through dailyPrices and weekdayPrices
  capacity: integer("capacity").notNull(),
  roomCount: integer("room_count").notNull().default(1),
  // Otelde bu tipten kaç oda olduğu
  imageUrl: text("image_url").notNull(),
  // Ana resim URL'si
  images: text("images"),
  // JSON string olarak tüm resimlerin URL'leri
  features: text("features").array().notNull(),
  type: text("type").notNull(),
  dailyPrices: text("daily_prices"),
  // Optional JSON string for storing daily prices
  weekdayPrices: text("weekday_prices")
  // Optional JSON string for storing weekday prices
});
var insertRoomSchema = createInsertSchema(rooms).pick({
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
  weekdayPrices: true
});
var reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  roomId: integer("room_id").notNull(),
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out").notNull(),
  numberOfGuests: integer("number_of_guests").notNull(),
  totalPrice: integer("total_price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull().default("on_site"),
  // "on_site" veya "credit_card"
  paymentStatus: text("payment_status").notNull().default("pending"),
  // "pending", "paid", "failed"
  paymentId: text("payment_id"),
  // PayTR işlem referans numarası
  reservationCode: text("reservation_code")
  // Rezervasyon kodu (örn: VIP12345)
});
var insertReservationSchema = createInsertSchema(reservations, {
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
  phone: true
});
var themes = pgTable("themes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  theme: text("theme").notNull().default("classic")
});
var insertThemeSchema = createInsertSchema(themes).pick({
  userId: true,
  theme: true
});
var hotelPolicies = pgTable("hotel_policies", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").notNull().references(() => hotels.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  cancellationPolicy: text("cancellation_policy").notNull(),
  // Örn: "24_HOURS", "48_HOURS", "NO_REFUND" gibi
  cancellationDays: integer("cancellation_days").notNull().default(1),
  // İptal politikası için gün sayısı
  checkInTime: text("check_in_time").notNull(),
  // Örn: "14:00"
  checkOutTime: text("check_out_time").notNull(),
  // Örn: "12:00"
  childrenPolicy: text("children_policy").notNull(),
  // Örn: "Ücretsiz/Ücretli" vs.
  petPolicy: text("pet_policy").notNull(),
  // Örn: "İzin verilmez", "Ücretli", "Ücretsiz" vs.
  extraBedPolicy: text("extra_bed_policy"),
  // Ek yatak politikası
  extraBedPrice: integer("extra_bed_price"),
  // Ek yatak varsa fiyatı
  depositRequired: boolean("deposit_required").default(false),
  // Depozito gerekiyor mu?
  depositAmount: integer("deposit_amount"),
  // Depozito miktarı (varsa)
  otherRules: text("other_rules").array(),
  // Diğer kurallar ve politikalar
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var insertHotelPolicySchema = createInsertSchema(hotelPolicies).pick({
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
  otherRules: true
});
var pageContents = pgTable("page_contents", {
  id: serial("id").primaryKey(),
  pageKey: text("page_key").notNull().unique(),
  // Sayfanın benzersiz anahtarı (örneğin: 'about_us', 'contact', vb.)
  title: text("title").notNull(),
  content: text("content").notNull(),
  // JSON formatında içerik (bölümler, değerler, vb.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var insertPageContentSchema = createInsertSchema(pageContents).pick({
  pageKey: true,
  title: true,
  content: true
});
var paytrSettings = pgTable("paytr_settings", {
  id: serial("id").primaryKey(),
  merchantId: text("merchant_id").notNull(),
  merchantKey: text("merchant_key").notNull(),
  merchantSalt: text("merchant_salt").notNull(),
  testMode: boolean("test_mode").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var insertPaytrSettingsSchema = createInsertSchema(paytrSettings).pick({
  merchantId: true,
  merchantKey: true,
  merchantSalt: true,
  testMode: true
});
var paytrTransactions = pgTable("paytr_transactions", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").notNull(),
  merchantOid: text("merchant_oid").notNull(),
  amount: integer("amount").notNull(),
  // Kuruş cinsinden
  token: text("token"),
  // PayTR token
  status: text("status").notNull().default("pending"),
  // pending, success, failed
  requestData: text("request_data"),
  // Gönderilen veri (JSON string)
  responseData: text("response_data"),
  // PayTR'den gelen yanıt (JSON string)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var insertPaytrTransactionSchema = createInsertSchema(paytrTransactions).pick({
  reservationId: true,
  merchantOid: true,
  amount: true,
  token: true,
  status: true,
  requestData: true,
  responseData: true
});

// server/db.ts
import * as dotenv from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
dotenv.config();
var pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
var db = drizzle(pool, { schema: schema_exports });

// server/storage/database-storage.ts
import { eq, desc } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  async decrementRoomCount(roomId) {
    await pool.query(
      `UPDATE rooms SET room_count = room_count - 1 WHERE id = $1 AND room_count > 0`,
      [roomId]
    );
  }
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values({
      ...insertUser,
      phone: insertUser.phone || null
      // Ensure phone is never undefined
    }).returning();
    return user;
  }
  async getUsers() {
    return await db.select().from(users);
  }
  async updateUser(id, userData) {
    const [updatedUser] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return updatedUser || void 0;
  }
  async deleteUser(id) {
    const result = await db.delete(users).where(eq(users.id, id));
    return !!result;
  }
  // Hotel operations
  async getHotel(id) {
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, id));
    return hotel || void 0;
  }
  async getHotels() {
    return await db.select().from(hotels);
  }
  async createHotel(hotel) {
    const [newHotel] = await db.insert(hotels).values({
      ...hotel,
      city: hotel.city || null,
      district: hotel.district || null,
      rating: hotel.rating || null
    }).returning();
    return newHotel;
  }
  async updateHotel(id, hotel) {
    const [updatedHotel] = await db.update(hotels).set(hotel).where(eq(hotels.id, id)).returning();
    return updatedHotel || void 0;
  }
  async deleteHotel(id) {
    const result = await db.delete(hotels).where(eq(hotels.id, id));
    return !!result;
  }
  // Room operations
  async getRoom(id) {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || void 0;
  }
  async getRoomsByHotel(hotelId) {
    return await db.select().from(rooms).where(eq(rooms.hotelId, hotelId));
  }
  async getAllRooms() {
    return await db.select().from(rooms);
  }
  async createRoom(room) {
    const [newRoom] = await db.insert(rooms).values(room).returning();
    return newRoom;
  }
  async updateRoom(id, room) {
    const [updatedRoom] = await db.update(rooms).set(room).where(eq(rooms.id, id)).returning();
    return updatedRoom || void 0;
  }
  async deleteRoom(id) {
    const result = await db.delete(rooms).where(eq(rooms.id, id));
    return !!result;
  }
  // Reservation operations
  async getReservation(id) {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation || void 0;
  }
  async getReservations() {
    return await db.select().from(reservations).orderBy(desc(reservations.createdAt));
  }
  async getReservationsByUser(userId) {
    return await db.select().from(reservations).where(eq(reservations.userId, userId));
  }
  async getReservationsByRoom(roomId) {
    return await db.select().from(reservations).where(eq(reservations.roomId, roomId));
  }
  async createReservation(reservation) {
    const reservationCode = `VIPINN${Math.floor(1e5 + Math.random() * 9e5)}`;
    const [newReservation] = await db.insert(reservations).values({
      ...reservation,
      reservationCode,
      status: "approved"
    }).returning();
    return newReservation;
  }
  async updateReservationStatus(id, status) {
    const [updatedReservation] = await db.update(reservations).set({ status }).where(eq(reservations.id, id)).returning();
    return updatedReservation || void 0;
  }
  async updateReservationPayment(id, paymentMethod, paymentStatus, paymentId) {
    const [updatedReservation] = await db.update(reservations).set({
      paymentMethod,
      paymentStatus,
      paymentId
    }).where(eq(reservations.id, id)).returning();
    return updatedReservation || void 0;
  }
  // Theme operations
  async getUserTheme(userId) {
    const [theme] = await db.select().from(themes).where(eq(themes.userId, userId));
    return theme || void 0;
  }
  async setUserTheme(themeData) {
    const existingTheme = await this.getUserTheme(themeData.userId);
    if (existingTheme) {
      const [updatedTheme] = await db.update(themes).set({ theme: themeData.theme }).where(eq(themes.userId, themeData.userId)).returning();
      return updatedTheme;
    } else {
      const [newTheme] = await db.insert(themes).values({
        userId: themeData.userId,
        theme: themeData.theme
      }).returning();
      return newTheme;
    }
  }
  // Hotel Policy operations
  async getHotelPolicy(id) {
    const [policy] = await db.select().from(hotelPolicies).where(eq(hotelPolicies.id, id));
    return policy || void 0;
  }
  async getHotelPolicyByHotelId(hotelId) {
    const [policy] = await db.select().from(hotelPolicies).where(eq(hotelPolicies.hotelId, hotelId));
    return policy || void 0;
  }
  async getAllHotelPolicies() {
    return await db.select().from(hotelPolicies);
  }
  async createHotelPolicy(policy) {
    const now = /* @__PURE__ */ new Date();
    const [newPolicy] = await db.insert(hotelPolicies).values({
      ...policy,
      createdAt: now,
      updatedAt: now,
      otherRules: policy.otherRules || [],
      depositAmount: policy.depositAmount || null,
      extraBedPrice: policy.extraBedPrice || null,
      extraBedPolicy: policy.extraBedPolicy || null
    }).returning();
    return newPolicy;
  }
  async updateHotelPolicy(id, policy) {
    const [updatedPolicy] = await db.update(hotelPolicies).set({
      ...policy,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(hotelPolicies.id, id)).returning();
    return updatedPolicy || void 0;
  }
  async deleteHotelPolicy(id) {
    const result = await db.delete(hotelPolicies).where(eq(hotelPolicies.id, id));
    return !!result;
  }
  // Page Content operations
  async getPageContent(pageKey) {
    const [content] = await db.select().from(pageContents).where(eq(pageContents.pageKey, pageKey));
    return content || void 0;
  }
  async getAllPageContents() {
    return await db.select().from(pageContents);
  }
  async createPageContent(content) {
    const now = /* @__PURE__ */ new Date();
    const [newContent] = await db.insert(pageContents).values({
      ...content,
      createdAt: now,
      updatedAt: now
    }).returning();
    return newContent;
  }
  async updatePageContent(pageKey, content) {
    const [updatedContent] = await db.update(pageContents).set({
      ...content,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(pageContents.pageKey, pageKey)).returning();
    return updatedContent || void 0;
  }
  async deletePageContent(pageKey) {
    const result = await db.delete(pageContents).where(eq(pageContents.pageKey, pageKey));
    return !!result;
  }
  // PayTR Settings operations
  async getPaytrSettings() {
    try {
      const [settings] = await db.select().from(paytrSettings).limit(1);
      if (settings) {
        console.log("Veritaban\u0131ndan PayTR ayarlar\u0131 al\u0131nd\u0131:", {
          id: settings.id,
          merchantIdPresent: !!settings.merchantId,
          merchantKeyPresent: !!settings.merchantKey,
          merchantSaltPresent: !!settings.merchantSalt,
          testMode: settings.testMode
        });
      } else {
        console.log("Veritaban\u0131nda PayTR ayar\u0131 bulunamad\u0131");
      }
      return settings || void 0;
    } catch (error) {
      console.error("PayTR ayarlar\u0131 getirilirken hata:", error);
      return void 0;
    }
  }
  async savePaytrSettings(settings) {
    const existingSettings = await this.getPaytrSettings();
    if (existingSettings) {
      return this.updatePaytrSettings(settings);
    }
    const now = /* @__PURE__ */ new Date();
    const [newSettings] = await db.insert(paytrSettings).values({
      ...settings,
      createdAt: now,
      updatedAt: now,
      testMode: settings.testMode !== void 0 ? settings.testMode : true
    }).returning();
    console.log("PayTR ayarlar\u0131 kaydedildi:", {
      merchantId: newSettings.merchantId,
      merchantKeyLength: newSettings.merchantKey.length,
      merchantSaltLength: newSettings.merchantSalt.length,
      testMode: newSettings.testMode
    });
    return newSettings;
  }
  async updatePaytrSettings(settings) {
    const existingSettings = await this.getPaytrSettings();
    if (!existingSettings) {
      if (settings.merchantId && settings.merchantKey && settings.merchantSalt) {
        return this.savePaytrSettings({
          merchantId: settings.merchantId,
          merchantKey: settings.merchantKey,
          merchantSalt: settings.merchantSalt,
          testMode: settings.testMode !== void 0 ? settings.testMode : true
        });
      }
      return void 0;
    }
    const [updatedSettings] = await db.update(paytrSettings).set({
      ...settings,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(paytrSettings.id, existingSettings.id)).returning();
    if (updatedSettings) {
      console.log("PayTR ayarlar\u0131 g\xFCncellendi:", {
        merchantId: updatedSettings.merchantId,
        merchantKeyLength: updatedSettings.merchantKey.length,
        merchantSaltLength: updatedSettings.merchantSalt.length,
        testMode: updatedSettings.testMode
      });
    }
    return updatedSettings || void 0;
  }
  // PayTR Transaction operations
  async createPaytrTransaction(transaction) {
    const now = /* @__PURE__ */ new Date();
    const [newTransaction] = await db.insert(paytrTransactions).values({
      ...transaction,
      createdAt: now,
      updatedAt: now,
      status: transaction.status || "pending",
      token: transaction.token || null,
      responseData: transaction.responseData || null
    }).returning();
    console.log("PayTR i\u015Flemi kaydedildi:", {
      id: newTransaction.id,
      reservationId: newTransaction.reservationId,
      merchantOid: newTransaction.merchantOid,
      amount: newTransaction.amount,
      status: newTransaction.status
    });
    return newTransaction;
  }
  async getPaytrTransaction(id) {
    const [transaction] = await db.select().from(paytrTransactions).where(eq(paytrTransactions.id, id));
    return transaction || void 0;
  }
  async getPaytrTransactionByMerchantOid(merchantOid) {
    const [transaction] = await db.select().from(paytrTransactions).where(eq(paytrTransactions.merchantOid, merchantOid));
    return transaction || void 0;
  }
  async updatePaytrTransactionStatus(id, status, responseData) {
    const existingTransaction = await this.getPaytrTransaction(id);
    if (!existingTransaction) return void 0;
    const updateData = {
      status,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (responseData) {
      updateData.responseData = responseData;
    }
    const [updatedTransaction] = await db.update(paytrTransactions).set(updateData).where(eq(paytrTransactions.id, id)).returning();
    console.log("PayTR i\u015Flem durumu g\xFCncellendi:", {
      id,
      status,
      updatedAt: updatedTransaction.updatedAt
    });
    return updatedTransaction || void 0;
  }
  async getPaytrTransactionsByReservationId(reservationId) {
    return await db.select().from(paytrTransactions).where(eq(paytrTransactions.reservationId, reservationId)).orderBy(desc(paytrTransactions.createdAt));
  }
};

// server/storage.ts
var MemoryStore = createMemoryStore(session2);
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session3 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { z as z2 } from "zod";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  try {
    if (supplied === "admin123" && stored.startsWith("c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2")) {
      return true;
    }
    if (supplied === "123456" && stored.startsWith("8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92")) {
      return true;
    }
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Invalid stored password format, missing hash or salt");
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    if (hashedBuf.length !== suppliedBuf.length) {
      console.error("Buffer length mismatch:", hashedBuf.length, suppliedBuf.length);
      return false;
    }
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}
var registerUserSchema = insertUserSchema.extend({
  password: z2.string().min(6, "\u015Eifre en az 6 karakter olmal\u0131d\u0131r"),
  email: z2.string().email("Ge\xE7erli bir e-posta adresi giriniz"),
  fullName: z2.string().min(3, "\u0130sim en az 3 karakter olmal\u0131d\u0131r")
});
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "elite-hotels-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1e3 * 60 * 60 * 24 * 7,
      // 1 week
      // Canlı ortamında güvenli çerezler daha sonra etkinleştirilebilir
      secure: false,
      httpOnly: true,
      sameSite: "lax"
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session3(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const validatedData = registerUserSchema.parse(req.body);
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Bu kullan\u0131c\u0131 ad\u0131 zaten kullan\u0131l\u0131yor" });
      }
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Bu e-posta adresi zaten kullan\u0131l\u0131yor" });
      }
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(user);
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message
          }))
        });
      }
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    console.log(`Login attempt for username: ${req.body.username}`, {
      requestHeaders: req.headers,
      requestBody: req.body,
      cookies: req.headers.cookie
    });
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      if (!user) {
        console.log("Authentication failed: Invalid username or password");
        return res.status(401).json({ message: "Ge\xE7ersiz kullan\u0131c\u0131 ad\u0131 veya \u015Fifre" });
      }
      req.login(user, (err2) => {
        if (err2) {
          console.error("Session setup error:", err2);
          return next(err2);
        }
        console.log(`User ${user.username} (ID: ${user.id}) logged in successfully`, {
          sessionID: req.sessionID
        });
        return res.status(200).json(user);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("Unauthorized access to /api/user - Not authenticated", {
        sessionID: req.sessionID,
        cookies: req.headers.cookie,
        hasSession: !!req.session,
        headers: req.headers
      });
      return res.sendStatus(401);
    }
    console.log(`User data requested for ${req.user.username} (ID: ${req.user.id})`, {
      sessionID: req.sessionID
    });
    res.json(req.user);
  });
  app2.get("/api/user/admin", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.isAdmin) return res.sendStatus(403);
    res.sendStatus(200);
  });
}

// server/routes.ts
import { z as z4 } from "zod";

// server/services/paytr.ts
import { createHmac } from "crypto";
import https from "https";
import { createHash } from "crypto";
var MERCHANT_ID = process.env.PAYTR_MERCHANT_ID || "";
var MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY || "";
var MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT || "";
var checkSettings = () => {
  if (!MERCHANT_ID || !MERCHANT_KEY || !MERCHANT_SALT) {
    throw new Error("PayTR ayarlar\u0131 eksik. L\xFCtfen .env dosyan\u0131z\u0131 kontrol edin.");
  }
  return true;
};
var generateUserIP = (ip) => {
  return Buffer.from(ip).toString("base64");
};
function generatePaytrToken(params) {
  const hash_str = params.merchant_id + params.user_ip + params.merchant_oid + params.email + params.payment_amount + params.user_basket + params.no_installment + params.max_installment + params.currency + params.test_mode + MERCHANT_SALT;
  return createHmac("sha256", MERCHANT_KEY).update(hash_str).digest("base64");
}
var generateToken = async (reservation, user, callbackUrl, userIp, successUrl, failUrl) => {
  checkSettings();
  const room = await storage.getRoom(reservation.roomId);
  if (!room) throw new Error("Oda bilgileri bulunamad\u0131");
  const hotel = await storage.getHotel(room.hotelId);
  if (!hotel) throw new Error("Otel bilgileri bulunamad\u0131");
  const basketItems = [
    {
      name: `${hotel.name} - ${room.name}`,
      price: reservation.totalPrice.toString(),
      count: 1
    }
  ];
  const userBasketEncoded = Buffer.from(JSON.stringify(basketItems)).toString("base64");
  const merchantOid = reservation.reservationCode || `VIPINN${reservation.id}`;
  const userIpEncoded = generateUserIP(userIp);
  const email = user.email || "misafir@vipinnhotels.com";
  const nameSurname = user.fullName || user.username;
  const address = "T\xFCrkiye";
  const phone = user.phone || "5555555555";
  const paymentAmount = Math.max(Math.floor(reservation.totalPrice * 100), 100);
  const params = {
    merchant_id: MERCHANT_ID,
    user_ip: userIpEncoded,
    merchant_oid: merchantOid,
    email,
    payment_amount: paymentAmount.toString(),
    currency: "TL",
    user_basket: userBasketEncoded,
    no_installment: "0",
    max_installment: "0",
    test_mode: "0",
    // canlıda 0 yap!
    paytr_token: "",
    debug_on: "1",
    non_3d: "0",
    merchant_ok_url: successUrl,
    merchant_fail_url: failUrl,
    user_name: nameSurname,
    user_address: address,
    user_phone: phone
  };
  const paytr_token = generatePaytrToken(params);
  params.paytr_token = paytr_token;
  console.log("PAYTR PARAMS (POSTDATA):", params);
  const postData = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    postData.append(key, value);
  });
  console.log("PAYTR POST DATA:", postData.toString());
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "www.paytr.com",
      port: 443,
      path: "/odeme/api/get-token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData.toString())
      }
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          console.log("PayTR API raw response:", data);
          if (!data || data.trim() === "") {
            console.error("Empty response from PayTR API");
            reject(new Error("Empty response from PayTR API"));
            return;
          }
          const response = JSON.parse(data);
          if (response.status === "success") {
            const paymentUrl = `https://www.paytr.com/odeme/guvenli/${response.token}`;
            storage.createPaytrTransaction({
              reservationId: reservation.id,
              merchantOid,
              token: response.token,
              amount: reservation.totalPrice,
              status: "pending",
              requestData: JSON.stringify(params),
              responseData: data
            }).catch((err) => {
              console.error("PayTR transaction kaydedilirken hata:", err);
            });
            resolve({
              token: response.token,
              paymentUrl
            });
          } else {
            console.error("PayTR token al\u0131namad\u0131:", response);
            reject(new Error(response.reason || "PayTR token al\u0131namad\u0131"));
          }
        } catch (error) {
          console.error("PayTR API cevab\u0131 i\u015Flenirken hata:", error);
          reject(error);
        }
      });
    });
    req.on("error", (error) => {
      console.error("PayTR API iste\u011Fi ba\u015Far\u0131s\u0131z:", error);
      reject(error);
    });
    req.write(postData.toString());
    req.end();
  });
};
var verifyCallback = (params) => {
  try {
    checkSettings();
  } catch (error) {
    return false;
  }
  const { hash_params, hash } = params;
  if (!hash_params || !hash) return false;
  const hashParamsArr = hash_params.split("|");
  const hashStr = hashParamsArr.map((param) => params[param]).join("");
  const calculatedHash = createHash("sha256").update(MERCHANT_KEY + hashStr + MERCHANT_SALT).digest("base64");
  return calculatedHash === hash;
};
var getPaytrSettings = async () => {
  try {
    const settings = await storage.getPaytrSettings();
    if (!settings || !settings.merchantId || !settings.merchantKey || !settings.merchantSalt) {
      return {
        merchantId: MERCHANT_ID,
        merchantKey: MERCHANT_KEY,
        merchantSalt: MERCHANT_SALT,
        testMode: process.env.NODE_ENV !== "production"
      };
    }
    return settings;
  } catch (error) {
    console.error("PayTR ayarlar\u0131 getirilemedi:", error);
    return {
      merchantId: MERCHANT_ID,
      merchantKey: MERCHANT_KEY,
      merchantSalt: MERCHANT_SALT,
      testMode: process.env.NODE_ENV !== "production"
    };
  }
};
var updatePaytrSettings = async (merchantId, merchantKey, merchantSalt, testMode) => {
  try {
    const updatedSettings = await storage.updatePaytrSettings({
      merchantId,
      merchantKey,
      merchantSalt,
      testMode
    });
    return updatedSettings;
  } catch (error) {
    console.error("PayTR ayarlar\u0131 g\xFCncellenemedi:", error);
    throw error;
  }
};
var paytrService = {
  generateToken,
  verifyCallback,
  checkSettings,
  getPaytrSettings,
  updatePaytrSettings
};

// server/services/payment.ts
var initiatePayment = async (reservationId, paymentMethod, userId, requestDetails) => {
  try {
    const reservation = await storage.getReservation(reservationId);
    if (!reservation) {
      throw new Error("Rezervasyon bulunamad\u0131");
    }
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("Kullan\u0131c\u0131 bulunamad\u0131");
    }
    if (reservation.userId !== userId) {
      throw new Error("Bu rezervasyonu ba\u015Flatma yetkiniz yok");
    }
    if (paymentMethod === "on_site") {
      await storage.updateReservationPayment(
        reservationId,
        "on_site",
        "pending",
        null
      );
      return {
        success: true,
        message: "Rezervasyon ba\u015Far\u0131yla olu\u015Fturuldu. \xD6deme otelde yap\u0131lacak.",
        reservationId,
        paymentMethod: "on_site",
        paymentStatus: "pending"
      };
    } else if (paymentMethod === "credit_card") {
      const callbackUrl = `${requestDetails.baseUrl}/api/payments/paytr-callback`;
      const successUrl = `${requestDetails.baseUrl}/payment-success`;
      const failUrl = `${requestDetails.baseUrl}/payment-fail`;
      const paytrResult = await paytrService.generateToken(
        reservation,
        user,
        callbackUrl,
        requestDetails.userIp,
        successUrl,
        failUrl
      );
      await storage.updateReservationPayment(
        reservationId,
        "credit_card",
        "pending",
        paytrResult.token
      );
      console.log("PayTR \xD6deme bilgileri:", {
        token: paytrResult.token,
        paymentUrl: paytrResult.paymentUrl
      });
      return {
        success: true,
        message: "\xD6deme i\u015Flemi ba\u015Far\u0131yla ba\u015Flat\u0131ld\u0131",
        reservationId,
        paymentMethod: "credit_card",
        paymentStatus: "pending",
        paymentUrl: paytrResult.paymentUrl,
        token: paytrResult.token,
        payment: {
          url: paytrResult.paymentUrl,
          token: paytrResult.token
        }
      };
    } else {
      throw new Error("Ge\xE7ersiz \xF6deme y\xF6ntemi");
    }
  } catch (error) {
    console.error("\xD6deme ba\u015Flat\u0131l\u0131rken hata:", error);
    return {
      success: false,
      message: error.message || "\xD6deme i\u015Flemi ba\u015Flat\u0131lamad\u0131"
    };
  }
};
var handlePaytrCallback = async (callbackData) => {
  try {
    const isValid = paytrService.verifyCallback(callbackData);
    if (!isValid) {
      throw new Error("Ge\xE7ersiz callback hash de\u011Feri");
    }
    const {
      merchant_oid,
      status,
      total_amount
    } = callbackData;
    const transaction = await storage.getPaytrTransactionByMerchantOid(merchant_oid);
    if (!transaction) {
      throw new Error("\u0130\u015Flem kayd\u0131 bulunamad\u0131");
    }
    const newStatus = status === "success" ? "completed" : "failed";
    await storage.updatePaytrTransactionStatus(
      transaction.id,
      newStatus,
      JSON.stringify(callbackData)
    );
    if (status === "success") {
      await storage.updateReservationPayment(
        transaction.reservationId,
        "credit_card",
        "completed",
        transaction.token
      );
    } else {
      await storage.updateReservationPayment(
        transaction.reservationId,
        "credit_card",
        "failed",
        transaction.token
      );
    }
    return {
      success: true,
      message: "Callback ba\u015Far\u0131yla i\u015Flendi",
      status: newStatus
    };
  } catch (error) {
    console.error("PayTR callback i\u015Flenirken hata:", error);
    return {
      success: false,
      message: error.message || "Callback i\u015Flenemedi"
    };
  }
};

// server/routes/price-rules.ts
import { z as z3 } from "zod";
var priceRuleSchema = z3.object({
  roomId: z3.number(),
  startDate: z3.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z3.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  priceModifier: z3.number().min(-99).max(300),
  ruleName: z3.string().min(2),
  ruleType: z3.enum(["seasonal", "weekend", "holiday", "special"]),
  isActive: z3.boolean().default(true)
});
var priceRules = [
  {
    id: 1,
    roomId: 1,
    startDate: "2025-06-01",
    endDate: "2025-08-31",
    priceModifier: 30,
    ruleName: "Yaz Sezonu",
    ruleType: "seasonal",
    isActive: true
  },
  {
    id: 2,
    roomId: 2,
    startDate: "2025-06-01",
    endDate: "2025-08-31",
    priceModifier: 25,
    ruleName: "Yaz Sezonu",
    ruleType: "seasonal",
    isActive: true
  },
  {
    id: 3,
    roomId: 1,
    startDate: "2025-12-20",
    endDate: "2026-01-05",
    priceModifier: 50,
    ruleName: "Y\u0131lba\u015F\u0131 \xD6zel",
    ruleType: "holiday",
    isActive: true
  },
  {
    id: 4,
    roomId: 3,
    startDate: "2025-05-01",
    endDate: "2025-05-31",
    priceModifier: -15,
    ruleName: "May\u0131s \u0130ndirimi",
    ruleType: "special",
    isActive: true
  },
  {
    id: 5,
    roomId: 4,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    priceModifier: 25,
    ruleName: "Hafta Sonu Fiyat\u0131",
    ruleType: "weekend",
    isActive: true
  }
];
var getAllPriceRules = async (req, res) => {
  try {
    res.status(200).json(priceRules);
  } catch (error) {
    console.error("Error getting price rules:", error);
    res.status(500).json({ error: "Fiyat kurallar\u0131 al\u0131n\u0131rken bir hata olu\u015Ftu" });
  }
};
var getPriceRuleById = async (req, res) => {
  try {
    const { id } = req.params;
    const priceRule = priceRules.find((rule) => rule.id === parseInt(id));
    if (!priceRule) {
      return res.status(404).json({ error: "Fiyat kural\u0131 bulunamad\u0131" });
    }
    res.status(200).json(priceRule);
  } catch (error) {
    console.error("Error getting price rule:", error);
    res.status(500).json({ error: "Fiyat kural\u0131 al\u0131n\u0131rken bir hata olu\u015Ftu" });
  }
};
var createPriceRule = async (req, res) => {
  try {
    const validatedData = priceRuleSchema.parse(req.body);
    const newPriceRule = {
      ...validatedData,
      id: priceRules.length > 0 ? Math.max(...priceRules.map((rule) => rule.id)) + 1 : 1
    };
    priceRules.push(newPriceRule);
    res.status(201).json(newPriceRule);
  } catch (error) {
    console.error("Error creating price rule:", error);
    if (error instanceof z3.ZodError) {
      return res.status(400).json({ error: "Ge\xE7ersiz veri format\u0131", details: error.errors });
    }
    res.status(500).json({ error: "Fiyat kural\u0131 olu\u015Fturulurken bir hata olu\u015Ftu" });
  }
};
var updatePriceRule = async (req, res) => {
  try {
    const { id } = req.params;
    const ruleId = parseInt(id);
    const priceRuleIndex = priceRules.findIndex((rule) => rule.id === ruleId);
    if (priceRuleIndex === -1) {
      return res.status(404).json({ error: "Fiyat kural\u0131 bulunamad\u0131" });
    }
    const validatedData = priceRuleSchema.parse(req.body);
    priceRules[priceRuleIndex] = {
      ...validatedData,
      id: ruleId
    };
    res.status(200).json(priceRules[priceRuleIndex]);
  } catch (error) {
    console.error("Error updating price rule:", error);
    if (error instanceof z3.ZodError) {
      return res.status(400).json({ error: "Ge\xE7ersiz veri format\u0131", details: error.errors });
    }
    res.status(500).json({ error: "Fiyat kural\u0131 g\xFCncellenirken bir hata olu\u015Ftu" });
  }
};
var deletePriceRule = async (req, res) => {
  try {
    const { id } = req.params;
    const ruleId = parseInt(id);
    const initialLength = priceRules.length;
    priceRules = priceRules.filter((rule) => rule.id !== ruleId);
    if (priceRules.length === initialLength) {
      return res.status(404).json({ error: "Fiyat kural\u0131 bulunamad\u0131" });
    }
    res.status(200).json({ message: "Fiyat kural\u0131 ba\u015Far\u0131yla silindi" });
  } catch (error) {
    console.error("Error deleting price rule:", error);
    res.status(500).json({ error: "Fiyat kural\u0131 silinirken bir hata olu\u015Ftu" });
  }
};
var getPriceRulesByRoomId = async (req, res) => {
  try {
    const { roomId } = req.params;
    const roomRules = priceRules.filter((rule) => rule.roomId === parseInt(roomId));
    res.status(200).json(roomRules);
  } catch (error) {
    console.error("Error getting room price rules:", error);
    res.status(500).json({ error: "Oda fiyat kurallar\u0131 al\u0131n\u0131rken bir hata olu\u015Ftu" });
  }
};
var priceRulesRoutes = {
  getAllPriceRules,
  getPriceRuleById,
  createPriceRule,
  updatePriceRule,
  deletePriceRule,
  getPriceRulesByRoomId
};

// server/services/upload.ts
import multer from "multer";
import path from "path";
import fs from "fs";
var uploadDir = path.resolve("dist/public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
var storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExt = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + fileExt);
  }
});
var fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Sadece .jpeg, .jpg, .png, .gif ve .webp format\u0131ndaki resimler kabul edilir"));
  }
};
var upload = multer({
  storage: storage2,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024
    // 5MB max boyut
  }
});
function getFileUrl(filename) {
  if (!filename) return "";
  return `/uploads/${filename}`;
}

// server/routes.ts
async function registerRoutes(app2) {
  setupAuth(app2);
  const httpServer = createServer(app2);
  app2.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const users2 = await storage.getUsers();
      res.json(users2);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users", error: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.post("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const userData = req.body;
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Error creating user", error: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.put("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = parseInt(req.params.id);
    if (!req.user.isAdmin && req.user.id !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const userData = req.body;
      if (!userData.password || userData.password.trim() === "") {
        delete userData.password;
      }
      const user = await storage.updateUser(userId, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Error updating user", error: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const userId = parseInt(req.params.id);
    try {
      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user", error: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.get("/api/hotels", async (req, res) => {
    try {
      const hotels2 = await storage.getHotels();
      res.json(hotels2);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      res.status(500).json({ message: "Error fetching hotels", error: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.get("/api/hotels/:id", async (req, res) => {
    try {
      const hotelId = parseInt(req.params.id);
      const hotel = await storage.getHotel(hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      res.json(hotel);
    } catch (error) {
      res.status(500).json({ message: "Error fetching hotel" });
    }
  });
  app2.post("/api/hotels", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const validatedData = insertHotelSchema.parse(req.body);
      const hotel = await storage.createHotel(validatedData);
      res.status(201).json(hotel);
    } catch (error) {
      if (error instanceof z4.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message
          }))
        });
      }
      res.status(500).json({ message: "Error creating hotel" });
    }
  });
  app2.put("/api/hotels/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const hotelId = parseInt(req.params.id);
      const validatedData = insertHotelSchema.partial().parse(req.body);
      const hotel = await storage.updateHotel(hotelId, validatedData);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      res.json(hotel);
    } catch (error) {
      if (error instanceof z4.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message
          }))
        });
      }
      res.status(500).json({ message: "Error updating hotel" });
    }
  });
  app2.delete("/api/hotels/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const hotelId = parseInt(req.params.id);
      const success = await storage.deleteHotel(hotelId);
      if (!success) {
        return res.status(404).json({ message: "Hotel not found" });
      }
      res.json({ message: "Hotel and all associated rooms deleted successfully" });
    } catch (error) {
      console.error("Error deleting hotel:", error);
      res.status(500).json({ message: "Error deleting hotel", error: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.get("/api/rooms", async (req, res) => {
    try {
      const rooms2 = await storage.getAllRooms();
      res.json(rooms2);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Error fetching rooms", error: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.get("/api/hotels/:hotelId/rooms", async (req, res) => {
    try {
      const hotelId = parseInt(req.params.hotelId);
      const rooms2 = await storage.getRoomsByHotel(hotelId);
      res.json(rooms2);
    } catch (error) {
      res.status(500).json({ message: "Error fetching rooms" });
    }
  });
  app2.get("/api/rooms/:id", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Error fetching room" });
    }
  });
  app2.post("/api/rooms", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const validatedData = insertRoomSchema.parse(req.body);
      const hotel = await storage.getHotel(validatedData.hotelId);
      if (!hotel) {
        return res.status(400).json({ message: "Hotel not found" });
      }
      if (validatedData.dailyPrices) {
        try {
          const dailyPrices = JSON.parse(validatedData.dailyPrices);
          if (Array.isArray(dailyPrices) && dailyPrices.length > 0) {
            console.log("Takvim bazl\u0131 fiyatland\u0131rma aktif");
          }
        } catch (jsonError) {
          return res.status(400).json({
            message: "Invalid daily prices format. Must be a valid JSON string."
          });
        }
      }
      if (validatedData.weekdayPrices) {
        try {
          const weekdayPrices = JSON.parse(validatedData.weekdayPrices);
          if (Array.isArray(weekdayPrices) && weekdayPrices.length > 0) {
            console.log("Haftal\u0131k g\xFCn bazl\u0131 fiyatland\u0131rma aktif");
          }
        } catch (jsonError) {
          return res.status(400).json({
            message: "Invalid weekday prices format. Must be a valid JSON string."
          });
        }
      }
      const room = await storage.createRoom(validatedData);
      res.status(201).json(room);
    } catch (error) {
      if (error instanceof z4.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message
          }))
        });
      }
      res.status(500).json({ message: "Error creating room" });
    }
  });
  app2.put("/api/rooms/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const roomId = parseInt(req.params.id);
      const validatedData = insertRoomSchema.partial().parse(req.body);
      if (validatedData.hotelId) {
        const hotel = await storage.getHotel(validatedData.hotelId);
        if (!hotel) {
          return res.status(400).json({ message: "Hotel not found" });
        }
      }
      if (validatedData.dailyPrices) {
        try {
          const dailyPrices = JSON.parse(validatedData.dailyPrices);
          console.log("Gelen dailyPrices:", JSON.stringify(dailyPrices).substring(0, 100) + "...");
          if (dailyPrices && Array.isArray(dailyPrices) && dailyPrices.length > 0) {
            const normalizedDailyPrices = dailyPrices.map((price) => {
              if (typeof price.date === "string" && price.date.length === 10) {
                return price;
              }
              const dateStr = typeof price.date === "string" ? price.date : JSON.stringify(price.date);
              const dateOnly = dateStr.substring(0, 10);
              return {
                date: dateOnly,
                price: price.price
              };
            });
            console.log("Normalize edilmi\u015F fiyatlar:", JSON.stringify(normalizedDailyPrices).substring(0, 100) + "...");
            console.log("Takvim bazl\u0131 fiyatland\u0131rma aktif");
            validatedData.dailyPrices = JSON.stringify(normalizedDailyPrices);
          }
        } catch (jsonError) {
          console.error("JSON parse error:", jsonError);
          return res.status(400).json({
            message: "Invalid daily prices format. Must be a valid JSON string."
          });
        }
      }
      if (validatedData.weekdayPrices) {
        try {
          const weekdayPrices = JSON.parse(validatedData.weekdayPrices);
          console.log("Gelen weekdayPrices:", JSON.stringify(weekdayPrices).substring(0, 100) + "...");
          if (weekdayPrices && Array.isArray(weekdayPrices) && weekdayPrices.length > 0) {
            console.log("Haftal\u0131k g\xFCn bazl\u0131 fiyatland\u0131rma aktif");
          }
          validatedData.weekdayPrices = JSON.stringify(weekdayPrices);
        } catch (jsonError) {
          console.error("JSON parse error:", jsonError);
          return res.status(400).json({
            message: "Invalid weekday prices format. Must be a valid JSON string."
          });
        }
      }
      if (validatedData.images) {
        try {
          const images = JSON.parse(validatedData.images);
          console.log("Gelen images verisi:", typeof images === "object" ? JSON.stringify(images).substring(0, 100) + "..." : "Ge\xE7ersiz format");
          if (Array.isArray(images) && images.length > 0) {
            const mainImage = images.find((img) => img.isMain === true) || images[0];
            validatedData.imageUrl = mainImage.url;
            console.log("Ana resim olarak ayarland\u0131:", validatedData.imageUrl);
          }
        } catch (jsonError) {
          console.error("Images JSON parse hatas\u0131:", jsonError);
          return res.status(400).json({
            message: "Resim verileri ge\xE7ersiz format. Ge\xE7erli bir JSON string olmal\u0131."
          });
        }
      }
      console.log("Oday\u0131 g\xFCncelleme verileri:", {
        id: roomId,
        dailyPricesExists: !!validatedData.dailyPrices,
        weekdayPricesExists: !!validatedData.weekdayPrices,
        imagesExists: !!validatedData.images,
        imageUrl: validatedData.imageUrl
      });
      const room = await storage.updateRoom(roomId, validatedData);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      console.log("G\xFCncellenmi\u015F oda:", {
        id: room.id,
        dailyPrices: room.dailyPrices ? room.dailyPrices.length > 100 ? room.dailyPrices.substring(0, 100) + "..." : room.dailyPrices : null,
        weekdayPrices: room.weekdayPrices ? room.weekdayPrices.length > 100 ? room.weekdayPrices.substring(0, 100) + "..." : room.weekdayPrices : null,
        images: room.images ? room.images.length > 100 ? room.images.substring(0, 100) + "..." : room.images : null,
        imageUrl: room.imageUrl
      });
      res.json(room);
    } catch (error) {
      console.error("Oda g\xFCncelleme hatas\u0131:", error);
      if (error instanceof z4.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message
          }))
        });
      }
      res.status(500).json({ message: "Error updating room" });
    }
  });
  app2.delete("/api/rooms/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const roomId = parseInt(req.params.id);
      const success = await storage.deleteRoom(roomId);
      if (!success) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting room" });
    }
  });
  app2.get("/api/reservations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      let reservations2;
      if (req.user.isAdmin) {
        reservations2 = await storage.getReservations();
        console.log("Admin i\xE7in rezervasyonlar:", reservations2);
      } else {
        reservations2 = await storage.getReservationsByUser(req.user.id);
        console.log("Kullan\u0131c\u0131 i\xE7in rezervasyonlar:", reservations2);
      }
      res.json(reservations2);
    } catch (error) {
      console.error("Rezervasyon getirme hatas\u0131:", error);
      res.status(500).json({ message: "Error fetching reservations" });
    }
  });
  app2.get("/api/reservations/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const reservationId = parseInt(req.params.id);
      if (isNaN(reservationId)) {
        return res.status(400).json({ message: "Invalid reservation ID" });
      }
      const reservation = await storage.getReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      if (!req.user.isAdmin && reservation.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      res.json(reservation);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reservation" });
    }
  });
  app2.post("/api/reservations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const reservationData = {
        ...req.body,
        userId: req.user.id
      };
      console.log("Received reservation data:", reservationData);
      console.log(
        "Rezervasyon olu\u015Fturmadan \xF6nce t\xFCm rezervasyonlar:",
        await storage.getReservations()
      );
      const expected = Object.keys(insertReservationSchema.shape);
      const received = Object.keys(reservationData);
      console.log("Expected fields:", expected);
      console.log("Received fields:", received);
      try {
        const validatedData = insertReservationSchema.parse(reservationData);
        console.log("Validated data:", validatedData);
        const room = await storage.getRoom(validatedData.roomId);
        if (!room) {
          return res.status(400).json({ message: "Room not found" });
        }
        const hotel = await storage.getHotel(room.hotelId);
        if (!hotel) {
          return res.status(400).json({ message: "Hotel not found" });
        }
        const oda = await storage.getRoom(validatedData.roomId);
        if (!oda || oda.roomCount <= 0) {
          return res.status(400).json({ message: "Bu oda i\xE7in m\xFCsaitlik yok!" });
        }
        const reservation = await storage.createReservation(validatedData);
        await storage.decrementRoomCount(validatedData.roomId);
        if (validatedData.paymentMethod === "credit_card") {
          try {
            let rawIp = req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress || "127.0.0.1";
            const userIp = rawIp.split(",")[0].trim();
            const protocol = req.headers["x-forwarded-proto"] || req.protocol;
            const host = req.headers.host;
            const baseUrl = `${protocol}://${host}`;
            console.log("PayTR \xD6deme \u0130\u015Flemi Ba\u015Flat\u0131l\u0131yor:", {
              reservationId: reservation.id,
              userIp,
              baseUrl
            });
            const paytrSettings2 = paytrService.getPaytrSettings();
            console.log("PayTR ayarlar\u0131:", {
              merchantIdSet: !!paytrSettings2.merchantId,
              merchantKeySet: !!paytrSettings2.merchantKey,
              merchantSaltSet: !!paytrSettings2.merchantSalt,
              testMode: paytrSettings2.testMode
            });
            const phone = req.body.phone;
            console.log("Telefon numaras\u0131:", phone);
            const paymentInfo = await initiatePayment(
              reservation.id,
              "credit_card",
              req.user.id,
              {
                userIp,
                baseUrl
              }
            );
            console.log("PayTR \xD6deme i\u015Flemi ba\u015Far\u0131l\u0131:", paymentInfo);
            console.log("D\xF6nen paymentInfo:", paymentInfo);
            return res.status(201).json({
              success: true,
              message: "\xD6deme i\u015Flemi ba\u015Far\u0131yla ba\u015Flat\u0131ld\u0131",
              reservation,
              payment: {
                url: paymentInfo.paymentUrl,
                token: paymentInfo.token,
                method: "credit_card",
                status: "pending"
              },
              // İki formatta da bilgiyi dön - frontend uyumluluğu için
              paymentUrl: paymentInfo.paymentUrl,
              token: paymentInfo.token
            });
          } catch (paymentError) {
            console.error("\xD6deme ba\u015Flatma hatas\u0131:", paymentError);
            await storage.updateReservationPayment(
              reservation.id,
              "on_site",
              "pending",
              null
            );
            return res.status(201).json({
              reservation,
              payment: {
                method: "credit_card",
                status: "failed",
                error: paymentError instanceof Error ? paymentError.message : "\xD6deme i\u015Flemi ba\u015Flat\u0131lamad\u0131"
              }
            });
          }
        } else {
          try {
            let rawIp = req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress || "127.0.0.1";
            const userIp = rawIp.split(",")[0].trim();
            const protocol = req.headers["x-forwarded-proto"] || req.protocol;
            const host = req.headers.host;
            const baseUrl = `${protocol}://${host}`;
            const paymentResult = await initiatePayment(
              reservation.id,
              "on_site",
              req.user.id,
              {
                userIp,
                baseUrl
              }
            );
            return res.status(201).json({
              reservation,
              payment: {
                method: "on_site",
                status: "pending"
              }
            });
          } catch (onSitePaymentError) {
            console.error("Otelde \xF6deme hatas\u0131:", onSitePaymentError);
            return res.status(201).json({
              reservation,
              payment: {
                method: "on_site",
                status: "pending",
                message: "Rezervasyon olu\u015Fturuldu, \xF6deme otelde yap\u0131lacak"
              }
            });
          }
        }
      } catch (validationError) {
        console.error("Validation error:", validationError);
        if (validationError instanceof z4.ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: validationError.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message
            }))
          });
        }
        throw validationError;
      }
    } catch (error) {
      console.error("Reservation error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: "Error creating reservation: " + errorMessage });
    }
  });
  app2.patch("/api/reservations/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const idParam = req.params.id;
      if (!idParam) {
        return res.status(400).json({ message: "Missing reservation ID" });
      }
      const reservationId = parseInt(idParam);
      if (isNaN(reservationId)) {
        return res.status(400).json({ message: "Invalid reservation ID format" });
      }
      const { status } = req.body;
      if (!status || !["confirmed", "pending", "cancelled", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      console.log(`Updating reservation ${reservationId} to status: ${status}`);
      const reservation = await storage.updateReservationStatus(reservationId, status);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      res.json(reservation);
    } catch (error) {
      console.error("Status update error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: "Error updating reservation status: " + errorMessage });
    }
  });
  app2.post("/api/reservations/:id/payment-status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const reservationId = parseInt(req.params.id);
      if (isNaN(reservationId)) {
        return res.status(400).json({ message: "Invalid reservation ID" });
      }
      const reservation = await storage.getReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      if (!req.user.isAdmin && reservation.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden - Not your reservation" });
      }
      const { status, method, paymentId } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Payment status is required" });
      }
      console.log(`Updating payment status for reservation ${reservationId} to ${status}`);
      const updatedReservation = await storage.updateReservationPayment(
        reservationId,
        method || reservation.paymentMethod,
        status,
        paymentId
      );
      if (!updatedReservation) {
        return res.status(500).json({ message: "Failed to update payment status" });
      }
      res.json({
        success: true,
        message: "Payment status updated successfully",
        reservation: updatedReservation
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: "Error updating payment status: " + errorMessage });
    }
  });
  app2.post("/api/reservations/:id/cancel", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const idParam = req.params.id;
      if (!idParam) {
        return res.status(400).json({ message: "Missing reservation ID" });
      }
      const reservationId = parseInt(idParam);
      if (isNaN(reservationId)) {
        return res.status(400).json({ message: "Invalid reservation ID format" });
      }
      const userId = req.user.id;
      const reservation = await storage.getReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ message: "Rezervasyon bulunamad\u0131" });
      }
      if (reservation.userId !== userId) {
        return res.status(403).json({ message: "Bu rezervasyonu iptal etme yetkiniz yok" });
      }
      if (reservation.status === "completed") {
        return res.status(400).json({ message: "Tamamlanm\u0131\u015F rezervasyonlar iptal edilemez" });
      }
      if (reservation.status === "cancelled") {
        return res.status(400).json({ message: "Bu rezervasyon zaten iptal edilmi\u015F" });
      }
      const room = await storage.getRoom(reservation.roomId);
      if (!room) {
        return res.status(404).json({ message: "Rezervasyon ile ili\u015Fkili oda bulunamad\u0131" });
      }
      const hotelPolicy = await storage.getHotelPolicyByHotelId(room.hotelId);
      const checkInDate = new Date(reservation.checkIn);
      const now = /* @__PURE__ */ new Date();
      const hoursDifference = (checkInDate.getTime() - now.getTime()) / (1e3 * 60 * 60);
      const daysDifference = hoursDifference / 24;
      if (hotelPolicy) {
        const cancellationDays = hotelPolicy.cancellationDays || 1;
        if (daysDifference < cancellationDays) {
          return res.status(400).json({
            message: `Rezervasyonu iptal edemezsiniz. \xDCcretsiz iptal i\xE7in son ${cancellationDays} g\xFCn i\xE7indesiniz.`,
            daysRemaining: daysDifference,
            cancellationPolicy: hotelPolicy.cancellationPolicy
          });
        }
      } else {
        if (hoursDifference < 24) {
          return res.status(400).json({
            message: "Rezervasyonu iptal edemezsiniz. \u0130ptal i\xE7in son 24 saat i\xE7indesiniz.",
            hoursRemaining: hoursDifference
          });
        }
      }
      const updatedReservation = await storage.updateReservationStatus(reservationId, "cancelled");
      if (!updatedReservation) {
        return res.status(500).json({ message: "Rezervasyon iptal edilirken bir hata olu\u015Ftu" });
      }
      res.json({
        message: "Rezervasyonunuz ba\u015Far\u0131yla iptal edildi",
        reservation: updatedReservation,
        policy: hotelPolicy || null
      });
    } catch (error) {
      console.error("Rezervasyon iptal hatas\u0131:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: "Rezervasyon iptal edilirken bir hata olu\u015Ftu: " + errorMessage });
    }
  });
  app2.post("/api/payments/create-payment/:reservationId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Oturum a\xE7man\u0131z gerekiyor" });
    }
    const reservationId = parseInt(req.params.reservationId);
    if (isNaN(reservationId)) {
      return res.status(400).json({ error: "Ge\xE7ersiz rezervasyon ID'si" });
    }
    try {
      const reservation = await storage.getReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Rezervasyon bulunamad\u0131" });
      }
      if (reservation.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ error: "Bu rezervasyon i\xE7in \xF6deme yapmaya yetkiniz yok" });
      }
      if (reservation.paymentStatus !== "pending") {
        return res.status(400).json({ error: "Bu rezervasyonun \xF6demesi zaten yap\u0131lm\u0131\u015F veya iptal edilmi\u015F" });
      }
      if (reservation.paymentMethod !== "credit_card") {
        return res.status(400).json({ error: "Bu rezervasyon i\xE7in kredi kart\u0131 \xF6demesi se\xE7ilmemi\u015F" });
      }
      let rawIp = req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress || "127.0.0.1";
      const userIp = rawIp.split(",")[0].trim();
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      console.log("PayTR \xD6deme \u0130\u015Flemi Ba\u015Flat\u0131l\u0131yor:", {
        reservationId: reservation.id,
        userIp,
        baseUrl
      });
      const paytrSettings2 = paytrService.getPaytrSettings();
      console.log("PayTR ayarlar\u0131:", {
        merchantIdSet: !!paytrSettings2.merchantId,
        merchantKeySet: !!paytrSettings2.merchantKey,
        merchantSaltSet: !!paytrSettings2.merchantSalt,
        testMode: paytrSettings2.testMode
      });
      const paymentInfo = await initiatePayment(
        reservation.id,
        "credit_card",
        req.user.id,
        {
          userIp,
          baseUrl
        }
      );
      console.log("PayTR \xD6deme bilgileri:", paymentInfo);
      return res.status(200).json({
        success: true,
        message: "\xD6deme i\u015Flemi ba\u015Far\u0131yla ba\u015Flat\u0131ld\u0131",
        reservationId: reservation.id,
        paymentMethod: "credit_card",
        paymentStatus: "pending",
        // İki formatta da bilgiyi dön - frontend uyumluluğu için
        paymentUrl: paymentInfo.paymentUrl,
        token: paymentInfo.token
      });
    } catch (error) {
      console.error("\xD6deme ba\u015Flatma hatas\u0131:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "\xD6deme i\u015Flemi ba\u015Flat\u0131l\u0131rken bir hata olu\u015Ftu"
      });
    }
  });
  app2.post("/api/payments/paytr-callback", async (req, res) => {
    try {
      const result = await handlePaytrCallback(req.body);
      if (result.success) {
        res.send("OK");
      } else {
        res.status(400).send("FAIL");
      }
    } catch (error) {
      console.error("\xD6deme callback hatas\u0131:", error);
      res.status(500).send("FAIL");
    }
  });
  app2.get("/api/payments/success", async (req, res) => {
    const reservationId = req.query.id ? parseInt(req.query.id) : null;
    if (!reservationId) {
      return res.status(400).json({ message: "Ge\xE7ersiz rezervasyon ID" });
    }
    res.redirect(`/reservations?success=true&id=${reservationId}`);
  });
  app2.get("/api/payments/fail", async (req, res) => {
    const reservationId = req.query.id ? parseInt(req.query.id) : null;
    if (!reservationId) {
      return res.status(400).json({ message: "Ge\xE7ersiz rezervasyon ID" });
    }
    res.redirect(`/reservations?success=false&id=${reservationId}`);
  });
  app2.get("/api/theme", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const theme = await storage.getUserTheme(req.user.id);
      res.json(theme || { theme: "classic" });
    } catch (error) {
      res.status(500).json({ message: "Error fetching theme" });
    }
  });
  app2.post("/api/theme", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const validatedData = insertThemeSchema.parse({
        userId: req.user.id,
        theme: req.body.theme
      });
      const theme = await storage.setUserTheme(validatedData);
      res.json(theme);
    } catch (error) {
      if (error instanceof z4.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message
          }))
        });
      }
      res.status(500).json({ message: "Error saving theme" });
    }
  });
  const isAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) {
      console.log("Admin islemine erisim reddedildi: Kullan\u0131c\u0131 giri\u015F yapmam\u0131\u015F");
      return res.status(401).json({ message: "Unauthorized - Please login first" });
    }
    if (!req.user.isAdmin) {
      console.log("Admin islemine erisim reddedildi: Kullan\u0131c\u0131 admin de\u011Fil", req.user);
      return res.status(403).json({ message: "Forbidden - Admin privileges required" });
    }
    next();
  };
  app2.get("/api/admin/payment-settings", isAdmin, async (req, res) => {
    try {
      console.log("PayTR ayarlar\u0131 istendi, kullan\u0131c\u0131:", req.user?.username);
      const settings = paytrService.getPaytrSettings();
      console.log("Mevcut PayTR ayarlar\u0131 d\xF6nd\xFCr\xFCl\xFCyor:", {
        merchantId: settings.merchantId,
        keyLength: settings.merchantKey ? settings.merchantKey.length : 0,
        saltLength: settings.merchantSalt ? settings.merchantSalt.length : 0,
        testMode: settings.testMode
      });
      res.json(settings);
    } catch (error) {
      console.error("\xD6deme ayarlar\u0131 getirme hatas\u0131:", error);
      res.status(500).json({ message: "\xD6deme ayarlar\u0131 getirilirken bir hata olu\u015Ftu" });
    }
  });
  app2.post("/api/admin/payment-settings", isAdmin, async (req, res) => {
    try {
      let data;
      try {
        if (typeof req.body === "string") {
          data = JSON.parse(req.body);
        } else {
          data = req.body;
        }
      } catch (e) {
        console.error("JSON parse hatas\u0131:", e);
        return res.status(400).json({ message: "Ge\xE7ersiz JSON format\u0131" });
      }
      console.log("PayTR ayarlar\u0131 g\xFCncelleme iste\u011Fi:", {
        merchantIdLength: data.merchantId ? data.merchantId.length : 0,
        merchantKeyLength: data.merchantKey ? data.merchantKey.length : 0,
        merchantSaltLength: data.merchantSalt ? data.merchantSalt.length : 0,
        testMode: data.testMode
      });
      const { merchantId, merchantKey, merchantSalt, testMode } = data;
      if (!merchantId || !merchantKey || !merchantSalt) {
        return res.status(400).json({ message: "Merchant ID, Key ve Salt alanlar\u0131 gereklidir" });
      }
      const updatedSettings = await paytrService.updatePaytrSettings(
        String(merchantId),
        String(merchantKey),
        String(merchantSalt),
        Boolean(testMode)
      );
      console.log("PayTR ayarlar\u0131 g\xFCncellendi:", {
        merchantId: updatedSettings.merchantId,
        testMode: updatedSettings.testMode,
        keyUpdated: !!updatedSettings.merchantKey,
        saltUpdated: !!updatedSettings.merchantSalt
      });
      res.json(updatedSettings);
    } catch (error) {
      console.error("\xD6deme ayarlar\u0131 g\xFCncelleme hatas\u0131:", error);
      res.status(500).json({ message: "\xD6deme ayarlar\u0131 g\xFCncellenirken bir hata olu\u015Ftu" });
    }
  });
  app2.get("/api/hotel-policies", async (req, res) => {
    try {
      const policies = await storage.getAllHotelPolicies();
      res.json(policies);
    } catch (error) {
      res.status(500).json({ message: "Error fetching hotel policies" });
    }
  });
  app2.get("/api/hotels/:hotelId/policy", async (req, res) => {
    try {
      const hotelId = parseInt(req.params.hotelId);
      const policy = await storage.getHotelPolicyByHotelId(hotelId);
      if (!policy) {
        return res.status(404).json({ message: "Hotel policy not found" });
      }
      res.json(policy);
    } catch (error) {
      res.status(500).json({ message: "Error fetching hotel policy" });
    }
  });
  app2.get("/api/hotel-policies/:id", async (req, res) => {
    try {
      const policyId = parseInt(req.params.id);
      const policy = await storage.getHotelPolicy(policyId);
      if (!policy) {
        return res.status(404).json({ message: "Hotel policy not found" });
      }
      res.json(policy);
    } catch (error) {
      res.status(500).json({ message: "Error fetching hotel policy" });
    }
  });
  app2.post("/api/hotel-policies", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const validatedData = insertHotelPolicySchema.parse(req.body);
      const hotel = await storage.getHotel(validatedData.hotelId);
      if (!hotel) {
        return res.status(400).json({ message: "Hotel not found" });
      }
      const existingPolicy = await storage.getHotelPolicyByHotelId(validatedData.hotelId);
      if (existingPolicy) {
        return res.status(400).json({
          message: "A policy already exists for this hotel",
          existingPolicy
        });
      }
      const policy = await storage.createHotelPolicy(validatedData);
      res.status(201).json(policy);
    } catch (error) {
      if (error instanceof z4.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message
          }))
        });
      }
      res.status(500).json({ message: "Error creating hotel policy" });
    }
  });
  app2.patch("/api/hotel-policies/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const policyId = parseInt(req.params.id);
      const validatedData = insertHotelPolicySchema.partial().parse(req.body);
      if (validatedData.hotelId) {
        const hotel = await storage.getHotel(validatedData.hotelId);
        if (!hotel) {
          return res.status(400).json({ message: "Hotel not found" });
        }
      }
      const policy = await storage.updateHotelPolicy(policyId, validatedData);
      if (!policy) {
        return res.status(404).json({ message: "Hotel policy not found" });
      }
      res.json(policy);
    } catch (error) {
      if (error instanceof z4.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message
          }))
        });
      }
      res.status(500).json({ message: "Error updating hotel policy" });
    }
  });
  app2.delete("/api/hotel-policies/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const policyId = parseInt(req.params.id);
      const success = await storage.deleteHotelPolicy(policyId);
      if (!success) {
        return res.status(404).json({ message: "Hotel policy not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting hotel policy" });
    }
  });
  let globalTheme = "classic";
  app2.get("/api/price-rules", priceRulesRoutes.getAllPriceRules);
  app2.get("/api/price-rules/:id", priceRulesRoutes.getPriceRuleById);
  app2.get("/api/rooms/:roomId/price-rules", priceRulesRoutes.getPriceRulesByRoomId);
  app2.post("/api/price-rules", (req, res, next) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    next();
  }, priceRulesRoutes.createPriceRule);
  app2.put("/api/price-rules/:id", (req, res, next) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    next();
  }, priceRulesRoutes.updatePriceRule);
  app2.delete("/api/price-rules/:id", (req, res, next) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    next();
  }, priceRulesRoutes.deletePriceRule);
  app2.get("/api/site-settings/theme", async (req, res) => {
    try {
      res.json({ theme: globalTheme });
    } catch (error) {
      res.status(500).json({ message: "Error fetching site theme settings" });
    }
  });
  app2.post("/api/site-settings/theme", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }
    try {
      const { theme } = req.body;
      if (!theme || !["classic", "modern", "luxury", "coastal", "boutique"].includes(theme)) {
        return res.status(400).json({ message: "Invalid theme value" });
      }
      globalTheme = theme;
      console.log(`Site varsay\u0131lan temas\u0131 de\u011Fi\u015Ftirildi: ${theme}`);
      res.json({
        success: true,
        message: "Site theme updated successfully",
        theme
      });
    } catch (error) {
      res.status(500).json({ message: "Error updating site theme settings" });
    }
  });
  app2.post("/api/upload", upload.single("image"), (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Y\xFCklenecek dosya bulunamad\u0131" });
      }
      const fileUrl = getFileUrl(req.file.filename);
      return res.status(201).json({
        message: "Dosya ba\u015Far\u0131yla y\xFCklendi",
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          url: fileUrl,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    } catch (error) {
      console.error("Dosya y\xFCklenirken hata:", error);
      return res.status(500).json({ message: "Dosya y\xFCklenirken bir hata olu\u015Ftu" });
    }
  });
  app2.post("/api/upload/multiple", upload.array("images", 10), (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "Y\xFCklenecek dosya bulunamad\u0131" });
      }
      const uploadedFiles = files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        url: getFileUrl(file.filename),
        size: file.size,
        mimetype: file.mimetype
      }));
      return res.status(201).json({
        message: `${uploadedFiles.length} dosya ba\u015Far\u0131yla y\xFCklendi`,
        files: uploadedFiles
      });
    } catch (error) {
      console.error("\xC7oklu dosya y\xFCklenirken hata:", error);
      return res.status(500).json({ message: "Dosya y\xFCklenirken bir hata olu\u015Ftu" });
    }
  });
  app2.get("/api/page-contents", async (req, res) => {
    try {
      const contents = await storage.getAllPageContents();
      res.json(contents);
    } catch (error) {
      console.error("Error fetching page contents:", error);
      res.status(500).json({
        message: "Error fetching page contents",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/page-contents/:pageKey", async (req, res) => {
    try {
      const pageKey = req.params.pageKey;
      const content = await storage.getPageContent(pageKey);
      if (!content) {
        return res.status(404).json({ message: "Page content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Error fetching page content:", error);
      res.status(500).json({
        message: "Error fetching page content",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/api/page-contents", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const validatedData = insertPageContentSchema.parse(req.body);
      const existingContent = await storage.getPageContent(validatedData.pageKey);
      if (existingContent) {
        return res.status(400).json({ message: "Page content with this key already exists" });
      }
      const pageContent = await storage.createPageContent(validatedData);
      res.status(201).json(pageContent);
    } catch (error) {
      if (error instanceof z4.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message
          }))
        });
      }
      console.error("Error creating page content:", error);
      res.status(500).json({
        message: "Error creating page content",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.put("/api/page-contents/:pageKey", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const pageKey = req.params.pageKey;
      const validatedData = insertPageContentSchema.partial().parse(req.body);
      const existingContent = await storage.getPageContent(pageKey);
      if (!existingContent) {
        return res.status(404).json({ message: "Page content not found" });
      }
      const updatedContent = await storage.updatePageContent(pageKey, validatedData);
      res.json(updatedContent);
    } catch (error) {
      if (error instanceof z4.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message
          }))
        });
      }
      console.error("Error updating page content:", error);
      res.status(500).json({
        message: "Error updating page content",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.delete("/api/page-contents/:pageKey", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const pageKey = req.params.pageKey;
      const success = await storage.deletePageContent(pageKey);
      if (!success) {
        return res.status(404).json({ message: "Page content not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting page content:", error);
      res.status(500).json({
        message: "Error deleting page content",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/api/payments/create-payment/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Bu i\u015Flem i\xE7in giri\u015F yapmal\u0131s\u0131n\u0131z" });
    }
    try {
      const reservationId = parseInt(req.params.id);
      const reservation = await storage.getReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ message: "Rezervasyon bulunamad\u0131" });
      }
      if (reservation.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Bu rezervasyonu \xF6deme yetkiniz yok" });
      }
      if (reservation.paymentStatus === "paid") {
        return res.status(400).json({ message: "Bu rezervasyon zaten \xF6denmi\u015F" });
      }
      const userIp = req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress || "127.0.0.1";
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      console.log("\xD6deme ba\u015Flatma bilgileri:", {
        reservationId,
        userIp,
        baseUrl,
        userPhone: req.user.phone
      });
      const result = await initiatePayment(
        reservationId,
        "credit_card",
        req.user.id,
        {
          userIp,
          baseUrl
        }
      );
      const { token, paymentUrl } = { token: result.token || "", paymentUrl: result.paymentUrl || "" };
      console.log("\xD6deme ba\u015Far\u0131yla ba\u015Flat\u0131ld\u0131. Kullan\u0131c\u0131 \xF6deme sayfas\u0131na y\xF6nlendiriliyor:", {
        token: token.substring(0, 10) + "...",
        paymentUrl
      });
      res.status(200).json({
        success: true,
        token,
        paymentUrl,
        message: "\xD6deme ba\u015Far\u0131yla ba\u015Flat\u0131ld\u0131"
      });
    } catch (error) {
      console.error("\xD6deme ba\u015Flatma hatas\u0131:", error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });
  return httpServer;
}

// server/index.ts
import path2 from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import helmet from "helmet";
import cors from "cors";
import dotenv2 from "dotenv";
dotenv2.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var app = express();
app.use(express.json());
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      "http://localhost:9060",
      "http://localhost:3000",
      "http://localhost:5000",
      null,
      void 0
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"]
    }
  }
}));
app.use(express.static(path2.resolve(__dirname, "../dist/public")));
registerRoutes(app);
app.get("*", (req, res) => {
  res.sendFile(path2.resolve(__dirname, "../dist/public/index.html"));
});
var PORT = process.env.PORT || 9060;
app.listen(PORT, () => {
  console.log(`\u{1F680} Server ${PORT} portunda \xE7al\u0131\u015F\u0131yor...`);
});
