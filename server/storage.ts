import {
  users, type User, type InsertUser,
  hotels, type Hotel, type InsertHotel,
  rooms, type Room, type InsertRoom,
  reservations, type Reservation, type InsertReservation,
  themes, type Theme, type InsertTheme,
  hotelPolicies, type HotelPolicy, type InsertHotelPolicy,
  pageContents, type PageContent, type InsertPageContent,
  paytrSettings, type PaytrSettings, type InsertPaytrSettings,
  paytrTransactions, type PaytrTransaction, type InsertPaytrTransaction
} from "@shared/schema";

import { db } from "./db"; // ✅ veritabanı bağlantısı
import { rooms as roomsTable } from "@shared/schema"; // ✅ rooms tablosu referansı
import { eq } from "drizzle-orm"; // ✅ where şartı için

import createMemoryStore from "memorystore";
import session from "express-session";
import { Store } from "express-session";

// Set up memory store for session management
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsers(): Promise<User[]>;

  // Hotel operations
  getHotel(id: number): Promise<Hotel | undefined>;
  getHotels(): Promise<Hotel[]>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  updateHotel(id: number, hotel: Partial<InsertHotel>): Promise<Hotel | undefined>;
  deleteHotel(id: number): Promise<boolean>;

  // Room operations
  getRoom(id: number): Promise<Room | undefined>;
  getRoomsByHotel(hotelId: number): Promise<Room[]>;
  getAllRooms(): Promise<Room[]>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, room: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<boolean>;

  // Reservation operations
  getReservation(id: number): Promise<Reservation | undefined>;
  getReservations(): Promise<Reservation[]>; // Tüm rezervasyonları getirme metodunu ekledik
  getReservationsByUser(userId: number): Promise<Reservation[]>;
  getReservationsByRoom(roomId: number): Promise<Reservation[]>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservationStatus(id: number, status: string): Promise<Reservation | undefined>;
  updateReservationPayment(id: number, paymentMethod: string, paymentStatus: string, paymentId: string | null): Promise<Reservation | undefined>;

  // Theme operations
  getUserTheme(userId: number): Promise<Theme | undefined>;
  setUserTheme(theme: InsertTheme): Promise<Theme>;

  // Hotel Policy operations
  getHotelPolicy(id: number): Promise<HotelPolicy | undefined>;
  getHotelPolicyByHotelId(hotelId: number): Promise<HotelPolicy | undefined>;
  getAllHotelPolicies(): Promise<HotelPolicy[]>;
  createHotelPolicy(policy: InsertHotelPolicy): Promise<HotelPolicy>;
  updateHotelPolicy(id: number, policy: Partial<InsertHotelPolicy>): Promise<HotelPolicy | undefined>;
  deleteHotelPolicy(id: number): Promise<boolean>;

  // Page Content operations
  getPageContent(pageKey: string): Promise<PageContent | undefined>;
  getAllPageContents(): Promise<PageContent[]>;
  createPageContent(content: InsertPageContent): Promise<PageContent>;
  updatePageContent(pageKey: string, content: Partial<InsertPageContent>): Promise<PageContent | undefined>;
  deletePageContent(pageKey: string): Promise<boolean>;

  // PayTR Settings operations
  getPaytrSettings(): Promise<PaytrSettings | undefined>;
  savePaytrSettings(settings: InsertPaytrSettings): Promise<PaytrSettings>;
  updatePaytrSettings(settings: Partial<InsertPaytrSettings>): Promise<PaytrSettings | undefined>;

  // PayTR Transaction operations
  createPaytrTransaction(transaction: InsertPaytrTransaction): Promise<PaytrTransaction>;
  getPaytrTransaction(id: number): Promise<PaytrTransaction | undefined>;
  getPaytrTransactionByMerchantOid(merchantOid: string): Promise<PaytrTransaction | undefined>;
  updatePaytrTransactionStatus(id: number, status: string, responseData?: string): Promise<PaytrTransaction | undefined>;
  getPaytrTransactionsByReservationId(reservationId: number): Promise<PaytrTransaction[]>;

  // Session store
  sessionStore: Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private hotels: Map<number, Hotel>;
  private rooms: Map<number, Room>;
  private reservations: Map<number, Reservation>;
  private themes: Map<number, Theme>;
  private hotelPolicies: Map<number, HotelPolicy>;
  private pageContents: Map<string, PageContent>;
  private paytrSettings: Map<number, PaytrSettings>;
  private paytrTransactions: Map<number, PaytrTransaction>;
  private userIdCounter: number;
  private hotelIdCounter: number;
  private roomIdCounter: number;
  private reservationIdCounter: number;
  private themeIdCounter: number;
  private hotelPolicyIdCounter: number;
  private pageContentIdCounter: number;
  private paytrSettingsIdCounter: number;
  private paytrTransactionIdCounter: number;

  dailyRoomQuotas: Map<string, number> = new Map();
  
  sessionStore: Store;

  constructor() {
    this.users = new Map();
    this.hotels = new Map();
    this.rooms = new Map();
    this.reservations = new Map();
    this.themes = new Map();
    this.hotelPolicies = new Map();
    this.pageContents = new Map();
    this.paytrSettings = new Map();
    this.paytrTransactions = new Map();
    this.userIdCounter = 1;
    this.hotelIdCounter = 1;
    this.roomIdCounter = 1;
    this.reservationIdCounter = 1;
    this.themeIdCounter = 1;
    this.hotelPolicyIdCounter = 1;
    this.pageContentIdCounter = 1;
    this.paytrSettingsIdCounter = 1;
    this.paytrTransactionIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Başlangıçta rezervasyon maps'inin doğru başlatıldığını kontrol et
    console.log("MemStorage başlatıldı. Boş rezervasyon map'i oluşturuldu.");
    console.log("Temiz mod: Test rezervasyonu eklenmedi.");

    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Create only admin users - no sample hotels or rooms
    Promise.all([
      // Create an admin user
      this.createUser({
        username: "admin",
        // Prehashed password: admin123
        password: "c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2.6c8974e592c2fa383d4a3960714caef0",
        fullName: "Admin User",
        email: "admin@elitehotels.com",
        phone: "+90 212 123 4567"
      }).then(user => {
        // Set user as admin
        this.users.set(user.id, { ...user, isAdmin: true });
        console.log("Admin user created:", user.username);
        return user;
      }),
      // Create a normal user
      this.createUser({
        username: "kaan",
        // Prehashed password: 123456
        password: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92.8d969eef6ecad3c29a3a629280e686cf",
        fullName: "Kaan Yılmaz",
        email: "kaan@example.com",
        phone: "+90 532 123 4567"
      }).then(user => {
        console.log("Regular user created:", user.username);
        return user;
      }),
      // Create a superadmin user
      this.createUser({
        username: "superadmin",
        // Prehashed password: admin123
        password: "c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2.6c8974e592c2fa383d4a3960714caef0",
        fullName: "Super Admin",
        email: "superadmin@elitehotels.com",
        phone: "+90 212 987 6543"
      }).then(user => {
        // Set user as admin
        this.users.set(user.id, { ...user, isAdmin: true });
        console.log("Superadmin user created:", user.username);
        return user;
      })
    ]).then(users => {
      console.log(`${users.length} users created`);
    });

    // No sample hotels or rooms - admin will add these manually
    console.log("No sample hotels or rooms created - admin will add them manually with calendar-based pricing");
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, isAdmin: false };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    // Şifre güncellemesi yapılacaksa, hashlenmiş olarak kabul ediyoruz
    // Auth servisinde şifre hashleme işlemleri yapıldığını varsayıyoruz
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Hotel operations
  async getHotel(id: number): Promise<Hotel | undefined> {
    return this.hotels.get(id);
  }

  async getHotels(): Promise<Hotel[]> {
    return Array.from(this.hotels.values());
  }

  async createHotel(hotel: InsertHotel): Promise<Hotel> {
    const id = this.hotelIdCounter++;
    const newHotel: Hotel = { ...hotel, id };
    this.hotels.set(id, newHotel);
    return newHotel;
  }

  async updateHotel(id: number, hotel: Partial<InsertHotel>): Promise<Hotel | undefined> {
    const existingHotel = this.hotels.get(id);
    if (!existingHotel) return undefined;

    const updatedHotel = { ...existingHotel, ...hotel };
    this.hotels.set(id, updatedHotel);
    return updatedHotel;
  }

  async deleteHotel(id: number): Promise<boolean> {
    // Otel var mı kontrol et
    const hotel = await this.getHotel(id);
    if (!hotel) {
      return false;
    }

    // Otele ait tüm odaları bul
    const hotelRooms = await this.getRoomsByHotel(id);

    // Odaları teker teker sil
    for (const room of hotelRooms) {
      await this.deleteRoom(room.id);
      console.log(`Otel silme işlemi: Oda silindi - ID: ${room.id}, Otel ID: ${id}`);
    }

    // Otele ait politikaları sil
    const policy = await this.getHotelPolicyByHotelId(id);
    if (policy) {
      await this.deleteHotelPolicy(policy.id);
      console.log(`Otel silme işlemi: Politika silindi - ID: ${policy.id}, Otel ID: ${id}`);
    }

    // Oteli sil
    const result = this.hotels.delete(id);
    console.log(`Otel silindi - ID: ${id}, Sonuç: ${result}`);
    return result;
  }

  // Room operations
 // async getRoom(id: number): Promise<Room | undefined> {
   // const room = this.rooms.get(id);
   // if (room) {
     // console.log(`Room retrieved: ID ${id}, dailyPrices: ${room.dailyPrices}, weekdayPrices: ${room.weekdayPrices}`);
   // }
   // return room;
 // }


//Room operations yeni hali
async getRoom(id: number): Promise<Room | undefined> {
  const room = this.rooms.get(id);
  if (!room) return undefined;

  const quotas: Record<string, number> = {};
  for (const [key, value] of this.dailyRoomQuotas.entries()) {
    const [roomIdStr, date] = key.split("-");
    if (parseInt(roomIdStr) === id) {
      quotas[date] = value;
    }
  }

  return {
    ...room,
    roomQuotas: quotas
  } as any; // Type hatasını önlemek için geçici çözüm
}


  async getRoomsByHotel(hotelId: number): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => room.hotelId === hotelId);
  }

  async getAllRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const id = this.roomIdCounter++;
    // roomCount değeri yoksa, varsayılan olarak 1 ayarla
    const roomCount = room.roomCount || 1;
    const newRoom: Room = {
      ...room,
      id,
      roomCount,
      images: room.images || null,
      dailyPrices: room.dailyPrices || null,
      weekdayPrices: room.weekdayPrices || null
    };
    this.rooms.set(id, newRoom);
    return newRoom;
  }

  async updateRoom(id: number, room: Partial<InsertRoom>): Promise<Room | undefined> {
    const existingRoom = this.rooms.get(id);
    if (!existingRoom) return undefined;

    const updatedRoom = { ...existingRoom, ...room };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(id: number): Promise<boolean> {
    return this.rooms.delete(id);
  }

  // Reservation operations
  async getReservation(id: number): Promise<Reservation | undefined> {
    return this.reservations.get(id);
  }

  // Yeni metod: Tüm rezervasyonları getir
  async getReservations(): Promise<Reservation[]> {
    return Array.from(this.reservations.values());
  }

  async getReservationsByUser(userId: number): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(res => res.userId === userId);
  }

  async getReservationsByRoom(roomId: number): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(res => res.roomId === roomId);
  }

  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    const id = this.reservationIdCounter++;
    const newReservation: Reservation = {
      ...reservation,
      id,
      createdAt: new Date(),
      status: "pending",
      paymentMethod: reservation.paymentMethod || "on_site",
      paymentStatus: "pending",
      paymentId: null
    };
    


if (reservation.dates && Array.isArray(reservation.dates)) {
  for (const date of reservation.dates) {
    const key = `${reservation.roomId}-${date}`;
    const quota = this.dailyRoomQuotas.get(key) ?? 0;
    if (quota <= 0) {
      throw new Error(`Yetersiz kontenjan: ${date}`);
    }
  }

  for (const date of reservation.dates) {
    const key = `${reservation.roomId}-${date}`;
    const quota = this.dailyRoomQuotas.get(key) ?? 0;
    this.dailyRoomQuotas.set(key, quota - 1);
  }
}


    this.reservations.set(id, newReservation);

    // Oluşturulan rezervasyonu logla ve rezervasyon sayısını kontrol et
    console.log("Oluşturulan rezervasyon:", newReservation);
    console.log("Toplam rezervasyon sayısı:", this.reservations.size);
    console.log("Tüm rezervasyonlar:", Array.from(this.reservations.values()));

    return newReservation;
  }

  async updateReservationStatus(id: number, status: string): Promise<Reservation | undefined> {
    console.log(`Storage: Updating reservation ${id} to status: ${status}`);

    if (isNaN(Number(id))) {
      console.error("Invalid reservation ID:", id);
      return undefined;
    }

    const existingReservation = this.reservations.get(id);
    if (!existingReservation) {
      console.error(`Reservation with ID ${id} not found`);
      return undefined;
    }

    // Validate status
    if (!["confirmed", "pending", "cancelled", "completed"].includes(status)) {
      console.error(`Invalid status: ${status}`);
      return undefined;
    }

    const updatedReservation = { ...existingReservation, status };
    this.reservations.set(id, updatedReservation);
    console.log(`Reservation ${id} status updated to ${status}`);
    return updatedReservation;
  }

  async updateReservationPayment(
    id: number,
    paymentMethod: string,
    paymentStatus: string,
    paymentId: string | null
  ): Promise<Reservation | undefined> {
    console.log(`Storage: Updating reservation ${id} payment info`);

    if (isNaN(Number(id))) {
      console.error("Invalid reservation ID:", id);
      return undefined;
    }

    const existingReservation = this.reservations.get(id);
    if (!existingReservation) {
      console.error(`Reservation with ID ${id} not found`);
      return undefined;
    }

    // Validate payment method
    if (!["on_site", "credit_card"].includes(paymentMethod)) {
      console.error(`Invalid payment method: ${paymentMethod}`);
      return undefined;
    }

    // Validate payment status
    if (!["pending", "paid", "failed"].includes(paymentStatus)) {
      console.error(`Invalid payment status: ${paymentStatus}`);
      return undefined;
    }

    const updatedReservation = {
      ...existingReservation,
      paymentMethod,
      paymentStatus,
      paymentId
    };

    this.reservations.set(id, updatedReservation);
    console.log(`Reservation ${id} payment info updated: ${paymentMethod}, ${paymentStatus}`);
    return updatedReservation;
  }

  // Theme operations
  async getUserTheme(userId: number): Promise<Theme | undefined> {
    return Array.from(this.themes.values()).find(theme => theme.userId === userId);
  }

  async setUserTheme(themeData: InsertTheme): Promise<Theme> {
    // Check if user already has a theme
    const existingTheme = await this.getUserTheme(themeData.userId);

    if (existingTheme) {
      // Update existing theme
      const updatedTheme = { ...existingTheme, theme: themeData.theme };
      this.themes.set(existingTheme.id, updatedTheme);
      return updatedTheme;
    } else {
      // Create new theme
      const id = this.themeIdCounter++;
      const newTheme: Theme = { ...themeData, id };
      this.themes.set(id, newTheme);
      return newTheme;
    }
  }

  // Hotel Policy operations
  async getHotelPolicy(id: number): Promise<HotelPolicy | undefined> {
    return this.hotelPolicies.get(id);
  }

  async getHotelPolicyByHotelId(hotelId: number): Promise<HotelPolicy | undefined> {
    return Array.from(this.hotelPolicies.values()).find(policy => policy.hotelId === hotelId);
  }

  async getAllHotelPolicies(): Promise<HotelPolicy[]> {
    return Array.from(this.hotelPolicies.values());
  }

  async createHotelPolicy(policy: InsertHotelPolicy): Promise<HotelPolicy> {
    const id = this.hotelPolicyIdCounter++;
    const newPolicy: HotelPolicy = {
      ...policy,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      otherRules: policy.otherRules || []
    };

    this.hotelPolicies.set(id, newPolicy);
    console.log(`Otel politikası oluşturuldu: ${policy.title} (Otel ID: ${policy.hotelId})`);
    return newPolicy;
  }

  async updateHotelPolicy(id: number, policy: Partial<InsertHotelPolicy>): Promise<HotelPolicy | undefined> {
    const existingPolicy = this.hotelPolicies.get(id);
    if (!existingPolicy) return undefined;

    const updatedPolicy = {
      ...existingPolicy,
      ...policy,
      updatedAt: new Date(),
      otherRules: policy.otherRules || existingPolicy.otherRules
    };

    this.hotelPolicies.set(id, updatedPolicy);
    console.log(`Otel politikası güncellendi: ID ${id}`);
    return updatedPolicy;
  }

  async deleteHotelPolicy(id: number): Promise<boolean> {
    return this.hotelPolicies.delete(id);
  }

  // Page Content operations
  async getPageContent(pageKey: string): Promise<PageContent | undefined> {
    return this.pageContents.get(pageKey);
  }

  async getAllPageContents(): Promise<PageContent[]> {
    return Array.from(this.pageContents.values());
  }

  async createPageContent(content: InsertPageContent): Promise<PageContent> {
    const id = this.pageContentIdCounter++;
    const newContent: PageContent = {
      ...content,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.pageContents.set(content.pageKey, newContent);
    console.log(`Sayfa içeriği oluşturuldu: ${content.title} (Anahtar: ${content.pageKey})`);
    return newContent;
  }

  async updatePageContent(pageKey: string, content: Partial<InsertPageContent>): Promise<PageContent | undefined> {
    const existingContent = this.pageContents.get(pageKey);
    if (!existingContent) return undefined;

    const updatedContent = {
      ...existingContent,
      ...content,
      updatedAt: new Date()
    };

    this.pageContents.set(pageKey, updatedContent);
    console.log(`Sayfa içeriği güncellendi: ${updatedContent.title} (Anahtar: ${pageKey})`);
    return updatedContent;
  }

  async deletePageContent(pageKey: string): Promise<boolean> {
    return this.pageContents.delete(pageKey);
  }

  // PayTR Settings operations
  async getPaytrSettings(): Promise<PaytrSettings | undefined> {
    // Her zaman sadece tek bir ayar kaydı olacak, ID=1
    return this.paytrSettings.get(1);
  }

  async savePaytrSettings(settings: InsertPaytrSettings): Promise<PaytrSettings> {
    const id = 1; // PayTR ayarları için sabit ID kullanıyoruz
    const newSettings: PaytrSettings = {
      ...settings,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.paytrSettings.set(id, newSettings);
    console.log("PayTR ayarları kaydedildi:", {
      merchantId: newSettings.merchantId,
      merchantKeyLength: newSettings.merchantKey.length,
      merchantSaltLength: newSettings.merchantSalt.length,
      testMode: newSettings.testMode
    });

    return newSettings;
  }

  async updatePaytrSettings(settings: Partial<InsertPaytrSettings>): Promise<PaytrSettings | undefined> {
    const existingSettings = await this.getPaytrSettings();

    if (!existingSettings) {
      // Ayarlar henüz yoksa, yeni oluştur
      if (!settings.merchantId || !settings.merchantKey || !settings.merchantSalt) {
        throw new Error("PayTR ayarları tam olarak sağlanmalıdır");
      }

      return this.savePaytrSettings({
        merchantId: settings.merchantId,
        merchantKey: settings.merchantKey,
        merchantSalt: settings.merchantSalt,
        testMode: settings.testMode || false
      });
    }

    // Mevcut ayarları güncelle
    const updatedSettings: PaytrSettings = {
      ...existingSettings,
      ...settings,
      updatedAt: new Date()
    };

    this.paytrSettings.set(1, updatedSettings);
    console.log("PayTR ayarları güncellendi:", {
      merchantId: updatedSettings.merchantId,
      merchantKeyLength: updatedSettings.merchantKey.length,
      merchantSaltLength: updatedSettings.merchantSalt.length,
      testMode: updatedSettings.testMode
    });

    return updatedSettings;
  }

  // PayTR Transaction operations
  async createPaytrTransaction(transaction: InsertPaytrTransaction): Promise<PaytrTransaction> {
    const id = this.paytrTransactionIdCounter++;
    const newTransaction: PaytrTransaction = {
      ...transaction,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.paytrTransactions.set(id, newTransaction);
    console.log("PayTR işlemi kaydedildi:", {
      id: newTransaction.id,
      reservationId: newTransaction.reservationId,
      merchantOid: newTransaction.merchantOid,
      amount: newTransaction.amount,
      status: newTransaction.status
    });

    return newTransaction;
  }

  async getPaytrTransaction(id: number): Promise<PaytrTransaction | undefined> {
    return this.paytrTransactions.get(id);
  }

  async getPaytrTransactionByMerchantOid(merchantOid: string): Promise<PaytrTransaction | undefined> {
    return Array.from(this.paytrTransactions.values()).find(
      transaction => transaction.merchantOid === merchantOid
    );
  }

  async updatePaytrTransactionStatus(id: number, status: string, responseData?: string): Promise<PaytrTransaction | undefined> {
    const existingTransaction = await this.getPaytrTransaction(id);
    if (!existingTransaction) return undefined;

    const updatedTransaction: PaytrTransaction = {
      ...existingTransaction,
      status,
      responseData: responseData || existingTransaction.responseData,
      updatedAt: new Date()
    };

    this.paytrTransactions.set(id, updatedTransaction);
    console.log("PayTR işlem durumu güncellendi:", {
      id,
      status,
      updatedAt: updatedTransaction.updatedAt
    });

    return updatedTransaction;
  }

  async getPaytrTransactionsByReservationId(reservationId: number): Promise<PaytrTransaction[]> {
    return Array.from(this.paytrTransactions.values()).filter(
      transaction => transaction.reservationId === reservationId
    );
  }
}


// Veritabanı depolamayı kullan
import { DatabaseStorage } from "./storage/database-storage";
export const storage = new DatabaseStorage();

import { db } from "./db";
import { rooms as roomsTable } from "@shared/schema";
import { eq } from "drizzle-orm";


storage.updateRoomDailyPrices = updateRoomDailyPrices;

async function updateRoomDailyPrices(roomId: number, dailyPrices: string): Promise<void> {
  console.log("updateRoomDailyPrices ÇAĞRILDI:", { roomId, dailyPrices });

  try {
    await db.update(roomsTable)
      .set({ dailyPrices })
      .where(eq(roomsTable.id, roomId));

    console.log("VERİTABANINA YAZILDI.");
  } catch (error) {
    console.error("updateRoomDailyPrices HATASI:", error);
  }
}

storage.updateRoomDailyPrices = updateRoomDailyPrices;
