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
import { pool, db } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";
import { IStorage } from "../storage";
import connectPg from "connect-pg-simple";
import session from "express-session";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        phone: insertUser.phone || null // Ensure phone is never undefined
      })
      .returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));
    return !!result;
  }

  // Hotel operations
  async getHotel(id: number): Promise<Hotel | undefined> {
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, id));
    return hotel || undefined;
  }

  async getHotels(): Promise<Hotel[]> {
    return await db.select().from(hotels);
  }

  async createHotel(hotel: InsertHotel): Promise<Hotel> {
    const [newHotel] = await db
      .insert(hotels)
      .values({
        ...hotel,
        city: hotel.city || null,
        district: hotel.district || null,
        rating: hotel.rating || null
      })
      .returning();
    return newHotel;
  }

  async updateHotel(id: number, hotel: Partial<InsertHotel>): Promise<Hotel | undefined> {
    const [updatedHotel] = await db
      .update(hotels)
      .set(hotel)
      .where(eq(hotels.id, id))
      .returning();
    return updatedHotel || undefined;
  }

  async deleteHotel(id: number): Promise<boolean> {
    const result = await db
      .delete(hotels)
      .where(eq(hotels.id, id));
    return !!result;
  }

  // Room operations
  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  async getRoomsByHotel(hotelId: number): Promise<Room[]> {
    return await db.select().from(rooms).where(eq(rooms.hotelId, hotelId));
  }

  async getAllRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db
      .insert(rooms)
      .values(room)
      .returning();
    return newRoom;
  }

  async updateRoom(id: number, room: Partial<InsertRoom>): Promise<Room | undefined> {
    const [updatedRoom] = await db
      .update(rooms)
      .set(room)
      .where(eq(rooms.id, id))
      .returning();
    return updatedRoom || undefined;
  }

  async deleteRoom(id: number): Promise<boolean> {
    const result = await db
      .delete(rooms)
      .where(eq(rooms.id, id));
    return !!result;
  }

  // Reservation operations
  async getReservation(id: number): Promise<Reservation | undefined> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation || undefined;
  }

  async getReservations(): Promise<Reservation[]> {
    return await db.select().from(reservations).orderBy(desc(reservations.createdAt));
  }

  async getReservationsByUser(userId: number): Promise<Reservation[]> {
    return await db.select().from(reservations).where(eq(reservations.userId, userId));
  }

  async getReservationsByRoom(roomId: number): Promise<Reservation[]> {
    return await db.select().from(reservations).where(eq(reservations.roomId, roomId));
  }

  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    // Rezervasyon kodu oluştur: "VIPINN" + rastgele 6 haneli sayı
    const reservationCode = `VIPINN${Math.floor(100000 + Math.random() * 900000)}`;
    
    const [newReservation] = await db
      .insert(reservations)
      .values({
        ...reservation,
        reservationCode
      })
      .returning();
    return newReservation;
  }

  async updateReservationStatus(id: number, status: string): Promise<Reservation | undefined> {
    const [updatedReservation] = await db
      .update(reservations)
      .set({ status })
      .where(eq(reservations.id, id))
      .returning();
    return updatedReservation || undefined;
  }

  async updateReservationPayment(
    id: number, 
    paymentMethod: string, 
    paymentStatus: string, 
    paymentId: string | null
  ): Promise<Reservation | undefined> {
    const [updatedReservation] = await db
      .update(reservations)
      .set({ 
        paymentMethod, 
        paymentStatus, 
        paymentId 
      })
      .where(eq(reservations.id, id))
      .returning();
    return updatedReservation || undefined;
  }

  // Theme operations
  async getUserTheme(userId: number): Promise<Theme | undefined> {
    const [theme] = await db.select().from(themes).where(eq(themes.userId, userId));
    return theme || undefined;
  }

  async setUserTheme(themeData: InsertTheme): Promise<Theme> {
    // Check if theme exists for user
    const existingTheme = await this.getUserTheme(themeData.userId);
    
    if (existingTheme) {
      // Update existing theme
      const [updatedTheme] = await db
        .update(themes)
        .set({ theme: themeData.theme })
        .where(eq(themes.userId, themeData.userId))
        .returning();
      return updatedTheme;
    } else {
      // Create new theme
      const [newTheme] = await db
        .insert(themes)
        .values({
          userId: themeData.userId,
          theme: themeData.theme
        })
        .returning();
      return newTheme;
    }
  }

  // Hotel Policy operations
  async getHotelPolicy(id: number): Promise<HotelPolicy | undefined> {
    const [policy] = await db.select().from(hotelPolicies).where(eq(hotelPolicies.id, id));
    return policy || undefined;
  }

  async getHotelPolicyByHotelId(hotelId: number): Promise<HotelPolicy | undefined> {
    const [policy] = await db.select().from(hotelPolicies).where(eq(hotelPolicies.hotelId, hotelId));
    return policy || undefined;
  }

  async getAllHotelPolicies(): Promise<HotelPolicy[]> {
    return await db.select().from(hotelPolicies);
  }

  async createHotelPolicy(policy: InsertHotelPolicy): Promise<HotelPolicy> {
    const now = new Date();
    
    const [newPolicy] = await db
      .insert(hotelPolicies)
      .values({
        ...policy,
        createdAt: now,
        updatedAt: now,
        otherRules: policy.otherRules || [],
        depositAmount: policy.depositAmount || null,
        extraBedPrice: policy.extraBedPrice || null,
        extraBedPolicy: policy.extraBedPolicy || null
      })
      .returning();
    return newPolicy;
  }

  async updateHotelPolicy(id: number, policy: Partial<InsertHotelPolicy>): Promise<HotelPolicy | undefined> {
    const [updatedPolicy] = await db
      .update(hotelPolicies)
      .set({
        ...policy,
        updatedAt: new Date()
      })
      .where(eq(hotelPolicies.id, id))
      .returning();
    return updatedPolicy || undefined;
  }

  async deleteHotelPolicy(id: number): Promise<boolean> {
    const result = await db
      .delete(hotelPolicies)
      .where(eq(hotelPolicies.id, id));
    return !!result;
  }

  // Page Content operations
  async getPageContent(pageKey: string): Promise<PageContent | undefined> {
    const [content] = await db.select().from(pageContents).where(eq(pageContents.pageKey, pageKey));
    return content || undefined;
  }

  async getAllPageContents(): Promise<PageContent[]> {
    return await db.select().from(pageContents);
  }

  async createPageContent(content: InsertPageContent): Promise<PageContent> {
    const now = new Date();
    
    const [newContent] = await db
      .insert(pageContents)
      .values({
        ...content,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return newContent;
  }

  async updatePageContent(pageKey: string, content: Partial<InsertPageContent>): Promise<PageContent | undefined> {
    const [updatedContent] = await db
      .update(pageContents)
      .set({
        ...content,
        updatedAt: new Date()
      })
      .where(eq(pageContents.pageKey, pageKey))
      .returning();
    return updatedContent || undefined;
  }

  async deletePageContent(pageKey: string): Promise<boolean> {
    const result = await db
      .delete(pageContents)
      .where(eq(pageContents.pageKey, pageKey));
    return !!result;
  }
  
  // PayTR Settings operations
  async getPaytrSettings(): Promise<PaytrSettings | undefined> {
    try {
      // Her zaman sadece tek bir ayar olacak, ID=1 veya ilk kaydı getir
      const [settings] = await db.select().from(paytrSettings).limit(1);
      
      if (settings) {
        console.log("Veritabanından PayTR ayarları alındı:", {
          id: settings.id,
          merchantIdPresent: !!settings.merchantId,
          merchantKeyPresent: !!settings.merchantKey,
          merchantSaltPresent: !!settings.merchantSalt,
          testMode: settings.testMode
        });
      } else {
        console.log("Veritabanında PayTR ayarı bulunamadı");
      }
      
      return settings || undefined;
    } catch (error) {
      console.error("PayTR ayarları getirilirken hata:", error);
      return undefined;
    }
  }
  
  async savePaytrSettings(settings: InsertPaytrSettings): Promise<PaytrSettings> {
    // Önce mevcut ayarları kontrol et
    const existingSettings = await this.getPaytrSettings();
    
    if (existingSettings) {
      // Varsa güncelle
      return this.updatePaytrSettings(settings) as Promise<PaytrSettings>;
    }
    
    // Yoksa yeni kayıt oluştur
    const now = new Date();
    
    const [newSettings] = await db
      .insert(paytrSettings)
      .values({
        ...settings,
        createdAt: now,
        updatedAt: now,
        testMode: settings.testMode !== undefined ? settings.testMode : true
      })
      .returning();
      
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
      // Ayarlar henüz yoksa ve tam veri sağlandıysa, yeni oluştur
      if (settings.merchantId && settings.merchantKey && settings.merchantSalt) {
        return this.savePaytrSettings({
          merchantId: settings.merchantId,
          merchantKey: settings.merchantKey,
          merchantSalt: settings.merchantSalt,
          testMode: settings.testMode !== undefined ? settings.testMode : true
        });
      }
      return undefined;
    }
    
    // Mevcut ayarları güncelle
    const [updatedSettings] = await db
      .update(paytrSettings)
      .set({
        ...settings,
        updatedAt: new Date()
      })
      .where(eq(paytrSettings.id, existingSettings.id))
      .returning();
      
    if (updatedSettings) {
      console.log("PayTR ayarları güncellendi:", {
        merchantId: updatedSettings.merchantId,
        merchantKeyLength: updatedSettings.merchantKey.length,
        merchantSaltLength: updatedSettings.merchantSalt.length,
        testMode: updatedSettings.testMode
      });
    }
    
    return updatedSettings || undefined;
  }
  
  // PayTR Transaction operations
  async createPaytrTransaction(transaction: InsertPaytrTransaction): Promise<PaytrTransaction> {
    const now = new Date();
    
    const [newTransaction] = await db
      .insert(paytrTransactions)
      .values({
        ...transaction,
        createdAt: now,
        updatedAt: now,
        status: transaction.status || "pending",
        token: transaction.token || null,
        responseData: transaction.responseData || null
      })
      .returning();
      
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
    const [transaction] = await db
      .select()
      .from(paytrTransactions)
      .where(eq(paytrTransactions.id, id));
    return transaction || undefined;
  }
  
  async getPaytrTransactionByMerchantOid(merchantOid: string): Promise<PaytrTransaction | undefined> {
    const [transaction] = await db
      .select()
      .from(paytrTransactions)
      .where(eq(paytrTransactions.merchantOid, merchantOid));
    return transaction || undefined;
  }
  
  async updatePaytrTransactionStatus(id: number, status: string, responseData?: string): Promise<PaytrTransaction | undefined> {
    const existingTransaction = await this.getPaytrTransaction(id);
    if (!existingTransaction) return undefined;
    
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (responseData) {
      updateData.responseData = responseData;
    }
    
    const [updatedTransaction] = await db
      .update(paytrTransactions)
      .set(updateData)
      .where(eq(paytrTransactions.id, id))
      .returning();
      
    console.log("PayTR işlem durumu güncellendi:", {
      id,
      status,
      updatedAt: updatedTransaction.updatedAt
    });
    
    return updatedTransaction || undefined;
  }
  
  async getPaytrTransactionsByReservationId(reservationId: number): Promise<PaytrTransaction[]> {
    return await db
      .select()
      .from(paytrTransactions)
      .where(eq(paytrTransactions.reservationId, reservationId))
      .orderBy(desc(paytrTransactions.createdAt));
  }
}
