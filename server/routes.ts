import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db, pool } from "./db"; // 👈 pool da geldi
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertHotelSchema, insertRoomSchema, insertReservationSchema, insertThemeSchema, insertHotelPolicySchema, insertPageContentSchema } from "@shared/schema";
import { initiatePayment, handlePaytrCallback } from "./services/payment";
import { paytrService } from "./services/paytr";
import { priceRulesRoutes } from "./routes/price-rules";
import { upload, getFileUrl } from "./services/upload";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // API routes

  // Kullanıcı listesi - sadece admin erişimi
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Kullanıcı ekleme - sadece admin erişimi
  app.post("/api/users", async (req, res) => {
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

  // Kullanıcı güncelleme - sadece admin erişimi veya kullanıcının kendisi
  app.put("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = parseInt(req.params.id);

    // Admin değilse, sadece kendi profilini güncelleyebilir
    if (!req.user.isAdmin && req.user.id !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const userData = req.body;

      // Eğer şifre alanı boşsa veya undefined ise, kaldır
      if (!userData.password || userData.password.trim() === '') {
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

  // Kullanıcı silme - sadece admin erişimi
  app.delete("/api/users/:id", async (req, res) => {
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

  // Hotel routes
  app.get("/api/hotels", async (req, res) => {
    try {
      const hotels = await storage.getHotels();
      res.json(hotels);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      res.status(500).json({ message: "Error fetching hotels", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/hotels/:id", async (req, res) => {
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

  // Admin protected route to create a hotel
  app.post("/api/hotels", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const validatedData = insertHotelSchema.parse(req.body);
      const hotel = await storage.createHotel(validatedData);
      res.status(201).json(hotel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      res.status(500).json({ message: "Error creating hotel" });
    }
  });

  // Admin protected route to update a hotel
  app.put("/api/hotels/:id", async (req, res) => {
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      res.status(500).json({ message: "Error updating hotel" });
    }
  });

  // Admin protected route to delete a hotel
  app.delete("/api/hotels/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const hotelId = parseInt(req.params.id);

      // İlgili odalar ve politikalar ile birlikte oteli sil
      // Not: Bu işlem storage.ts'deki deleteHotel metodunda gerçekleşir
      const success = await storage.deleteHotel(hotelId);

      if (!success) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // Başarılı silme işleminde detaylı mesaj döndürüyoruz
      res.json({ message: "Hotel and all associated rooms deleted successfully" });
    } catch (error) {
      console.error("Error deleting hotel:", error);
      res.status(500).json({ message: "Error deleting hotel", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Room routes
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getAllRooms();
      const roomsWithQuotas = await Promise.all(
      rooms.map(async (room) => {
        const quotasResult = await pool.query(
          "SELECT date, quota FROM room_quotas WHERE room_id = $1",
          [room.id]
        );

        return {
          ...room,
          roomQuotas: quotasResult.rows,
        };
      })
    );
      res.json(roomsWithQuotas); 
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Error fetching rooms", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/hotels/:hotelId/rooms", async (req, res) => {
    try {
      const hotelId = parseInt(req.params.hotelId);
      const rooms = await storage.getRoomsByHotel(hotelId);
      // Artık takvim bazlı fiyatlandırma varsa sabit fiyatı 0 yapmıyoruz
      // Kullanıcı arayüzünde, takvim fiyatları varsa onları, yoksa sabit fiyatı göstereceğiz
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Error fetching rooms" });
    }
  });

  
app.get("/api/rooms/:id", async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const room = await storage.getRoom(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // room_quotas bilgilerini ekle
    const quotaResult = await pool.query(
      "SELECT date, quota FROM room_quotas WHERE room_id = $1",
      [roomId]
    );
    room.roomQuotas = quotaResult.rows.map((r) => ({
  date: r.date.toISOString().slice(0, 10),
  count: r.quota,
}));

    res.json(room);
  } catch (error) {
    console.error("Room fetch error:", error);
    res.status(500).json({ message: "Error fetching room" });
  }
});




  // Admin protected route to create a room
  app.post("/api/rooms", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const validatedData = insertRoomSchema.parse(req.body);

      // Validate hotel exists
      const hotel = await storage.getHotel(validatedData.hotelId);
      if (!hotel) {
        return res.status(400).json({ message: "Hotel not found" });
      }

      // Parse daily prices if provided
      if (validatedData.dailyPrices) {
        try {
          // Validate that dailyPrices is a valid JSON string
          const dailyPrices = JSON.parse(validatedData.dailyPrices);

          // Takvim bazlı fiyatlandırma varsa bunu loglayalım
          if (Array.isArray(dailyPrices) && dailyPrices.length > 0) {
            console.log("Takvim bazlı fiyatlandırma aktif");
          }
        } catch (jsonError) {
          return res.status(400).json({
            message: "Invalid daily prices format. Must be a valid JSON string."
          });
        }
      }

      // Weekday prices check
      if (validatedData.weekdayPrices) {
        try {
          const weekdayPrices = JSON.parse(validatedData.weekdayPrices);

          // Haftalık gün bazlı fiyatlandırma varsa bunu loglayalım
          if (Array.isArray(weekdayPrices) && weekdayPrices.length > 0) {
            console.log("Haftalık gün bazlı fiyatlandırma aktif");
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      res.status(500).json({ message: "Error creating room" });
    }
  });

// ✅ Yeni endpoint: Admin room quota güncelleme
app.put("/api/room-quotas/:roomId", async (req, res) => {
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const roomId = parseInt(req.params.roomId);
  const quotas = req.body;

  if (!Array.isArray(quotas)) {
    return res.status(400).json({ message: "Invalid quota data" });
  }

  try {
    await pool.query("DELETE FROM room_quotas WHERE room_id = $1", [roomId]);

    for (const q of quotas) {
      await pool.query(
        "INSERT INTO room_quotas (room_id, date, quota) VALUES ($1, $2, $3)",
        [roomId, q.date, q.quota ?? 0]
      );
    }

    res.json({ success: true, message: "Room quotas updated." });
  } catch (error) {
    console.error("Room quota update error:", error);
    res.status(500).json({ message: "Failed to update room quotas" });
  }
});

  // Admin protected route to update a room
  app.put("/api/rooms/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const roomId = parseInt(req.params.id);
      const validatedData = insertRoomSchema.partial().parse(req.body);

      // If hotelId is included, validate hotel exists
      if (validatedData.hotelId) {
        const hotel = await storage.getHotel(validatedData.hotelId);
        if (!hotel) {
          return res.status(400).json({ message: "Hotel not found" });
      }
      }

      // Parse daily prices if provided
      if (validatedData.dailyPrices) {
        try {
          // Validate that dailyPrices is a valid JSON string
          const dailyPrices = JSON.parse(validatedData.dailyPrices);
          console.log("Gelen dailyPrices:", JSON.stringify(dailyPrices).substring(0, 100) + "...");

          // Burada tarih biçimlerini kontrol edelim ve standardize edelim
          if (dailyPrices && Array.isArray(dailyPrices) && dailyPrices.length > 0) {
            // Tarihleri standardize et (client yyyy-MM-dd formatında gönderecek)
            const normalizedDailyPrices = dailyPrices.map(price => {
              // Tarih stringi yyyy-MM-dd formatında gelebilir
              if (typeof price.date === 'string' && price.date.length === 10) {
                // Tarih string olarak geldi, doğru formatta ise muhafaza et
                return price;
              }
              // Date nesnesi veya farklı bir format ise uyumlu hale getir
              const dateStr = typeof price.date === 'string'
                ? price.date
                : JSON.stringify(price.date);

              // Tarih kısmını çıkar (yyyy-MM-dd)
              const dateOnly = dateStr.substring(0, 10);

              return {
                date: dateOnly,
                price: price.price,
                count: price.count ?? 0
              };

            });

            console.log("Normalize edilmiş fiyatlar:", JSON.stringify(normalizedDailyPrices).substring(0, 100) + "...");

            // Takvim bazlı fiyatlandırma varsa bunu loglayalım
            console.log("Takvim bazlı fiyatlandırma aktif");

            // Standardize edilmiş tarihleri JSON string olarak kaydet
            validatedData.dailyPrices = JSON.stringify(normalizedDailyPrices);
         
            for (const p of normalizedDailyPrices) {
            if (p.date && typeof p.count === "number") {
            await pool.query(
  `INSERT INTO room_quotas (room_id, date, quota)
   VALUES ($1, $2, $3)
   ON CONFLICT (room_id, date)
   DO UPDATE SET quota = EXCLUDED.quota`,
  [roomId, p.date, p.count]
);


         }
       }  
     }
        } catch (jsonError) {
          console.error("JSON parse error:", jsonError);
          return res.status(400).json({
            message: "Invalid daily prices format. Must be a valid JSON string."
          });
        }
      }

      // Parse weekday prices if provided
      if (validatedData.weekdayPrices) {
        try {
          // Validate that weekdayPrices is a valid JSON string
          const weekdayPrices = JSON.parse(validatedData.weekdayPrices);
          console.log("Gelen weekdayPrices:", JSON.stringify(weekdayPrices).substring(0, 100) + "...");

          // Haftalık gün bazlı fiyatlandırma varsa bunu loglayalım
          if (weekdayPrices && Array.isArray(weekdayPrices) && weekdayPrices.length > 0) {
            console.log("Haftalık gün bazlı fiyatlandırma aktif");
          }

          // JSON string olarak saklayacağımızı tekrar doğrulayalım
          validatedData.weekdayPrices = JSON.stringify(weekdayPrices);
        } catch (jsonError) {
          console.error("JSON parse error:", jsonError);
          return res.status(400).json({
            message: "Invalid weekday prices format. Must be a valid JSON string."
          });
        }
      }

      // Images alanını kontrol et ve işle
      if (validatedData.images) {
        try {
          // Images JSON string'ini doğrula
          const images = JSON.parse(validatedData.images);
          console.log("Gelen images verisi:", typeof images === 'object' ? JSON.stringify(images).substring(0, 100) + '...' : 'Geçersiz format');

          // Ana resmi imageUrl olarak ayarla
          if (Array.isArray(images) && images.length > 0) {
            // Ana resmi (isMain=true) bul veya ilkini kullan
            const mainImage = images.find((img: any) => img.isMain === true) || images[0];
            validatedData.imageUrl = mainImage.url;
            console.log("Ana resim olarak ayarlandı:", validatedData.imageUrl);
          }

        } catch (jsonError) {
          console.error("Images JSON parse hatası:", jsonError);
          return res.status(400).json({
            message: "Resim verileri geçersiz format. Geçerli bir JSON string olmalı."
          });
        }
      }

      console.log("Odayı güncelleme verileri:", {
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

      // Güncellenmiş odanın tam verisini logla
      console.log("Güncellenmiş oda:", {
        id: room.id,
        dailyPrices: room.dailyPrices ? (room.dailyPrices.length > 100 ? room.dailyPrices.substring(0, 100) + "..." : room.dailyPrices) : null,
        weekdayPrices: room.weekdayPrices ? (room.weekdayPrices.length > 100 ? room.weekdayPrices.substring(0, 100) + "..." : room.weekdayPrices) : null,
        images: room.images ? (room.images.length > 100 ? room.images.substring(0, 100) + "..." : room.images) : null,
        imageUrl: room.imageUrl
      });

      res.json(room);
    } catch (error) {
      console.error("Oda güncelleme hatası:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      res.status(500).json({ message: "Error updating room" });
    }
  });

  // Admin protected route to delete a room
  app.delete("/api/rooms/:id", async (req, res) => {
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

  // Reservation routes
  app.get("/api/reservations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      let reservations;

      // Admins can see all reservations, users can only see their own
      if (req.user.isAdmin) {
        // Admin görünümü için tüm rezervasyonları getir
        reservations = await storage.getReservations();
        console.log("Admin için rezervasyonlar:", reservations);
      } else {
        // Normal kullanıcı için sadece kendi rezervasyonlarını getir
        reservations = await storage.getReservationsByUser(req.user.id);
        console.log("Kullanıcı için rezervasyonlar:", reservations);
      }

      res.json(reservations);
    } catch (error) {
      console.error("Rezervasyon getirme hatası:", error);
      res.status(500).json({ message: "Error fetching reservations" });
    }
  });

  // Get a specific reservation
  app.get("/api/reservations/:id", async (req, res) => {
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

      // Admins can see any reservation, users can only see their own
      if (!req.user.isAdmin && reservation.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      res.json(reservation);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reservation" });
    }
  });

  // Create a reservation - requires authentication
  app.post("/api/reservations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Parse data with the current user's ID
      const reservationData = {
        ...req.body,
        userId: req.user.id
      };

      console.log("Received reservation data:", reservationData);

      // Mevcut tüm rezervasyonları logla
      console.log("Rezervasyon oluşturmadan önce tüm rezervasyonlar:",
        await storage.getReservations());

      // Validation debug: Log expected vs received fields
      const expected = Object.keys(insertReservationSchema.shape);
      const received = Object.keys(reservationData);
      console.log("Expected fields:", expected);
      console.log("Received fields:", received);

      try {
        const validatedData = insertReservationSchema.parse(reservationData);
        console.log("Validated data:", validatedData);
      
       if (reservationData.dailyPrices) {
       validatedData.dailyPrices = reservationData.dailyPrices;
       console.log("validatedData.dailyPrices yüklendi:", validatedData.dailyPrices);
       }


        // Validate room exists
        const room = await storage.getRoom(validatedData.roomId);
        if (!room) {
          return res.status(400).json({ message: "Room not found" });
        }

        // Otelin bilgilerini getir
        const hotel = await storage.getHotel(room.hotelId);
        if (!hotel) {
          return res.status(400).json({ message: "Hotel not found" });
        }
        // Oda kontenjanını kontrol et!
       // const oda = await storage.getRoom(validatedData.roomId);
       // if (!oda || oda.roomCount <= 0) {
         // return res.status(400).json({ message: "Bu oda için müsaitlik yok!" });
       // }

        // Create reservation
        
      // Check-in → Check-out arası tüm tarihleri diziye al
// const oda = await storage.getRoom(validatedData.roomId);
// if (!oda || oda.roomCount <= 0) {
//   return res.status(400).json({ message: "Bu oda için müsaitlik yok!" });
// }

// ✅ Kontenjan kontrolü (yeni sistem)
const selectedDates = [];
for (let d = new Date(validatedData.checkIn); d < new Date(validatedData.checkOut); d.setDate(d.getDate() + 1)) {
  selectedDates.push(new Date(d).toISOString().slice(0, 10));
}

const placeholders = selectedDates.map((_, i) => `$${i + 2}`).join(", ");
const quotaResult = await pool.query(
  `SELECT date, quota FROM room_quotas WHERE room_id = $1 AND date IN (${placeholders})`,
  [validatedData.roomId, ...selectedDates]
);

const quotaMap = new Map(quotaResult.rows.map(r => [r.date.toISOString().slice(0,10), r.quota]));

for (const date of selectedDates) {
  const quota = quotaMap.get(date);
  if (quota === undefined || quota <= 0) {
    return res.status(400).json({ message: `Seçilen tarihte kontenjan yok: ${date}` });
  }
}

for (const date of selectedDates) {
  await pool.query(
    `UPDATE room_quotas SET quota = quota - 1 WHERE room_id = $1 AND date = $2`,
    [validatedData.roomId, date]
  );
}


const reservation = await storage.createReservation(validatedData);

        // Handle payment based on selected payment method
        if (validatedData.paymentMethod === "credit_card") {
          try {
            // PayTR için gerekli bilgileri hazırla
            // IP adresini al ve virgülle ayrılmışsa ilk IP adresini kullan
            let rawIp = req.headers['x-forwarded-for']?.toString() ||
              req.socket.remoteAddress ||
              '127.0.0.1';

            // Virgülle ayrılmış IP adreslerinden ilkini al ve boşlukları temizle
            // PayTR için IP formatı önemli, yanlış formatta olursa token üretimi başarısız olur
            const userIp = rawIp.split(',')[0].trim();

            // Base URL oluştur
            const protocol = req.headers['x-forwarded-proto'] || req.protocol;
            const host = req.headers.host;
            const baseUrl = `${protocol}://${host}`;

            console.log("PayTR Ödeme İşlemi Başlatılıyor:", {
              reservationId: reservation.id,
              userIp,
              baseUrl
            });

            // PayTR ayarlarını kontrol et
            const paytrSettings = paytrService.getPaytrSettings();
            console.log("PayTR ayarları:", {
              merchantIdSet: !!paytrSettings.merchantId,
              merchantKeySet: !!paytrSettings.merchantKey,
              merchantSaltSet: !!paytrSettings.merchantSalt,
              testMode: paytrSettings.testMode
            });

            // Telefon numarasını al (eğer varsa)
            const phone = req.body.phone;
            console.log("Telefon numarası:", phone);

            // Kredi kartı ödeme işlemini başlat
            const paymentInfo = await initiatePayment(
              reservation.id,
              'credit_card',
              req.user.id,
              {
                userIp,
                baseUrl
              }
            );

            console.log("PayTR Ödeme işlemi başarılı:", paymentInfo);

            // PayTR ödeme sayfasına yönlendirme URL'ini döndür
            // Doğrudan payment.url yerine paymentUrl parametresi olarak gönder
            console.log("Dönen paymentInfo:", paymentInfo);
            return res.status(201).json({
              success: true,
              message: "Ödeme işlemi başarıyla başlatıldı",
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
            console.error("Ödeme başlatma hatası:", paymentError);

            // Otelde ödeme olarak güncelle
            await storage.updateReservationPayment(
              reservation.id,
              "on_site",
              "pending",
              null
            );

            // Ödeme hatası olsa bile rezervasyonu döndür
            return res.status(201).json({
              reservation,
              payment: {
                method: "credit_card",
                status: "failed",
                error: paymentError instanceof Error ? paymentError.message : "Ödeme işlemi başlatılamadı"
              }
            });
          }
        } else {
          // Otelde ödeme seçilmişse
          try {
            // IP adresini al
            let rawIp = req.headers['x-forwarded-for']?.toString() ||
              req.socket.remoteAddress ||
              '127.0.0.1';

            // Virgülle ayrılmış IP adreslerinden ilkini al
            const userIp = rawIp.split(',')[0].trim();

            // Base URL oluştur
            const protocol = req.headers['x-forwarded-proto'] || req.protocol;
            const host = req.headers.host;
            const baseUrl = `${protocol}://${host}`;

            const paymentResult = await initiatePayment(
              reservation.id,
              'on_site',
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
            console.error("Otelde ödeme hatası:", onSitePaymentError);
            return res.status(201).json({
              reservation,
              payment: {
                method: "on_site",
                status: "pending",
                message: "Rezervasyon oluşturuldu, ödeme otelde yapılacak"
              }
            });
          }
        }
      } catch (validationError) {
        console.error("Validation error:", validationError);
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: validationError.errors.map(e => ({
              path: e.path.join('.'),
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

  // Update reservation status - admin only
  app.patch("/api/reservations/:id/status", async (req, res) => {
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

  // Müşterilerin kendi rezervasyonlarını iptal etmesi için endpoint
  // Update payment status endpoint
  app.post("/api/reservations/:id/payment-status", async (req, res) => {
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

      // Kullanıcılar sadece kendi rezervasyonlarını güncelleyebilir
      if (!req.user.isAdmin && reservation.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden - Not your reservation" });
      }

      const { status, method, paymentId } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Payment status is required" });
      }

      // Ödeme durumunu güncelle
      console.log(`Updating payment status for reservation ${reservationId} to ${status}`);

      // Önce ödeme durumunu güncelle
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

  app.post("/api/reservations/:id/cancel", async (req, res) => {
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

      // Önce rezervasyonu al
      const reservation = await storage.getReservation(reservationId);

      // Rezervasyon yoksa hata döndür
      if (!reservation) {
        return res.status(404).json({ message: "Rezervasyon bulunamadı" });
      }

      // Sadece kullanıcı kendi rezervasyonunu iptal edebilir
      if (reservation.userId !== userId) {
        return res.status(403).json({ message: "Bu rezervasyonu iptal etme yetkiniz yok" });
      }

      // Rezervasyon durumunu kontrol et - tamamlanmış rezervasyonlar iptal edilemez
      if (reservation.status === "completed") {
        return res.status(400).json({ message: "Tamamlanmış rezervasyonlar iptal edilemez" });
      }

      // Rezervasyon iptal edilmiş mi kontrol et
      if (reservation.status === "cancelled") {
        return res.status(400).json({ message: "Bu rezervasyon zaten iptal edilmiş" });
      }

      // Rezervasyona ait odayı ve oteli al
      const room = await storage.getRoom(reservation.roomId);
      if (!room) {
        return res.status(404).json({ message: "Rezervasyon ile ilişkili oda bulunamadı" });
      }

      // Otel politikasını al
      const hotelPolicy = await storage.getHotelPolicyByHotelId(room.hotelId);

      const checkInDate = new Date(reservation.checkIn);
      const now = new Date();
      const hoursDifference = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const daysDifference = hoursDifference / 24;

      // Otel politikası varsa, iptal politikasını kontrol et
      if (hotelPolicy) {
        // Otelin iptal politikasına göre kontrol yap
        const cancellationDays = hotelPolicy.cancellationDays || 1; // Default olarak 1 gün

        // İptal için gereken minimum gün sayısını kontrol et
        if (daysDifference < cancellationDays) {
          return res.status(400).json({
            message: `Rezervasyonu iptal edemezsiniz. Ücretsiz iptal için son ${cancellationDays} gün içindesiniz.`,
            daysRemaining: daysDifference,
            cancellationPolicy: hotelPolicy.cancellationPolicy
          });
        }
      } else {
        // Otel politikası yoksa, varsayılan 24 saat kuralını uygula
        if (hoursDifference < 24) {
          return res.status(400).json({
            message: "Rezervasyonu iptal edemezsiniz. İptal için son 24 saat içindesiniz.",
            hoursRemaining: hoursDifference
          });
        }
      }

      // Rezervasyonu iptal et
      const updatedReservation = await storage.updateReservationStatus(reservationId, "cancelled");

      if (!updatedReservation) {
        return res.status(500).json({ message: "Rezervasyon iptal edilirken bir hata oluştu" });
      }

      res.json({
        message: "Rezervasyonunuz başarıyla iptal edildi",
        reservation: updatedReservation,
        policy: hotelPolicy || null
      });
    } catch (error) {
      console.error("Rezervasyon iptal hatası:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: "Rezervasyon iptal edilirken bir hata oluştu: " + errorMessage });
    }
  });

  // Rezervasyon detay sayfasından ödeme başlatma endpoint'i
  app.post("/api/payments/create-payment/:reservationId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Oturum açmanız gerekiyor" });
    }

    const reservationId = parseInt(req.params.reservationId);

    if (isNaN(reservationId)) {
      return res.status(400).json({ error: "Geçersiz rezervasyon ID'si" });
    }

    try {
      // Rezervasyon bilgilerini getir
      const reservation = await storage.getReservation(reservationId);

      if (!reservation) {
        return res.status(404).json({ error: "Rezervasyon bulunamadı" });
      }

      // Sadece kullanıcının kendi rezervasyonlarını ödeme yetkisi var
      if (reservation.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ error: "Bu rezervasyon için ödeme yapmaya yetkiniz yok" });
      }

      // Rezervasyon hala beklemede ve kredi kartı ile ödeme seçili mi?
      if (reservation.paymentStatus !== "pending") {
        return res.status(400).json({ error: "Bu rezervasyonun ödemesi zaten yapılmış veya iptal edilmiş" });
      }

      if (reservation.paymentMethod !== "credit_card") {
        return res.status(400).json({ error: "Bu rezervasyon için kredi kartı ödemesi seçilmemiş" });
      }

      // IP adresini al ve virgülle ayrılmışsa ilk IP adresini kullan
      let rawIp = req.headers['x-forwarded-for']?.toString() ||
        req.socket.remoteAddress ||
        '127.0.0.1';

      // Virgülle ayrılmış IP adreslerinden ilkini al
      const userIp = rawIp.split(',')[0].trim();

      // Base URL oluştur
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;

      console.log("PayTR Ödeme İşlemi Başlatılıyor:", {
        reservationId: reservation.id,
        userIp,
        baseUrl
      });

      // PayTR ayarlarını kontrol et
      const paytrSettings = paytrService.getPaytrSettings();
      console.log("PayTR ayarları:", {
        merchantIdSet: !!paytrSettings.merchantId,
        merchantKeySet: !!paytrSettings.merchantKey,
        merchantSaltSet: !!paytrSettings.merchantSalt,
        testMode: paytrSettings.testMode
      });

      // Kredi kartı ödeme işlemini başlat
      const paymentInfo = await initiatePayment(
        reservation.id,
        'credit_card',
        req.user.id,
        {
          userIp,
          baseUrl
        }
      );

      console.log("PayTR Ödeme bilgileri:", paymentInfo);

      // PayTR ödeme sayfasına yönlendirme URL'ini döndür
      return res.status(200).json({
        success: true,
        message: "Ödeme işlemi başarıyla başlatıldı",
        reservationId: reservation.id,
        paymentMethod: "credit_card",
        paymentStatus: "pending",
        // İki formatta da bilgiyi dön - frontend uyumluluğu için
        paymentUrl: paymentInfo.paymentUrl,
        token: paymentInfo.token
      });
    } catch (error) {
      console.error("Ödeme başlatma hatası:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Ödeme işlemi başlatılırken bir hata oluştu"
      });
    }
  });

  // Payment callback routes
  app.post("/api/payments/paytr-callback", async (req, res) => {
    try {
      const result = await handlePaytrCallback(req.body);
      if (result.success) {
        // PayTR callback'i için başarı yanıtı
        res.send('OK');
      } else {
        res.status(400).send('FAIL');
      }
    } catch (error) {
      console.error("Ödeme callback hatası:", error);
      res.status(500).send('FAIL');
    }
  });

  app.get("/api/payments/success", async (req, res) => {
    const reservationId = req.query.id ? parseInt(req.query.id as string) : null;
    if (!reservationId) {
      return res.status(400).json({ message: "Geçersiz rezervasyon ID" });
    }

    // Kullanıcıyı rezervasyon sayfasına yönlendir
    res.redirect(`/reservations?success=true&id=${reservationId}`);
  });

  app.get("/api/payments/fail", async (req, res) => {
    const reservationId = req.query.id ? parseInt(req.query.id as string) : null;
    if (!reservationId) {
      return res.status(400).json({ message: "Geçersiz rezervasyon ID" });
    }

    // Kullanıcıyı rezervasyon sayfasına yönlendir
    res.redirect(`/reservations?success=false&id=${reservationId}`);
  });

  // Theme routes
  app.get("/api/theme", async (req, res) => {
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

  app.post("/api/theme", async (req, res) => {
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      res.status(500).json({ message: "Error saving theme" });
    }
  });

  // Admin middleware - admin yetkisi kontrolü için
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      console.log("Admin islemine erisim reddedildi: Kullanıcı giriş yapmamış");
      return res.status(401).json({ message: "Unauthorized - Please login first" });
    }

    if (!req.user.isAdmin) {
      console.log("Admin islemine erisim reddedildi: Kullanıcı admin değil", req.user);
      return res.status(403).json({ message: "Forbidden - Admin privileges required" });
    }

    next();
  };

  // Admin payment settings endpoints
  app.get("/api/admin/payment-settings", isAdmin, async (req, res) => {
    try {
      console.log("PayTR ayarları istendi, kullanıcı:", req.user?.username);
      const settings = paytrService.getPaytrSettings();

      // Ayarlar güncel mi diye son kez kontrol
      console.log("Mevcut PayTR ayarları döndürülüyor:", {
        merchantId: settings.merchantId,
        keyLength: settings.merchantKey ? settings.merchantKey.length : 0,
        saltLength: settings.merchantSalt ? settings.merchantSalt.length : 0,
        testMode: settings.testMode
      });

      res.json(settings);
    } catch (error) {
      console.error("Ödeme ayarları getirme hatası:", error);
      res.status(500).json({ message: "Ödeme ayarları getirilirken bir hata oluştu" });
    }
  });

  app.post("/api/admin/payment-settings", isAdmin, async (req, res) => {
    try {
      // JSON formatını kontrol et
      let data;
      try {
        if (typeof req.body === 'string') {
          data = JSON.parse(req.body);
        } else {
          data = req.body;
        }
      } catch (e) {
        console.error("JSON parse hatası:", e);
        return res.status(400).json({ message: "Geçersiz JSON formatı" });
      }

      console.log("PayTR ayarları güncelleme isteği:", {
        merchantIdLength: data.merchantId ? data.merchantId.length : 0,
        merchantKeyLength: data.merchantKey ? data.merchantKey.length : 0,
        merchantSaltLength: data.merchantSalt ? data.merchantSalt.length : 0,
        testMode: data.testMode
      });

      const { merchantId, merchantKey, merchantSalt, testMode } = data;

      if (!merchantId || !merchantKey || !merchantSalt) {
        return res.status(400).json({ message: "Merchant ID, Key ve Salt alanları gereklidir" });
      }

      const updatedSettings = await paytrService.updatePaytrSettings(
        String(merchantId),
        String(merchantKey),
        String(merchantSalt),
        Boolean(testMode)
      );

      console.log("PayTR ayarları güncellendi:", {
        merchantId: updatedSettings.merchantId,
        testMode: updatedSettings.testMode,
        keyUpdated: !!updatedSettings.merchantKey,
        saltUpdated: !!updatedSettings.merchantSalt
      });

      res.json(updatedSettings);
    } catch (error) {
      console.error("Ödeme ayarları güncelleme hatası:", error);
      res.status(500).json({ message: "Ödeme ayarları güncellenirken bir hata oluştu" });
    }
  });

  // Hotel Policy routes

  // Get all hotel policies
  app.get("/api/hotel-policies", async (req, res) => {
    try {
      const policies = await storage.getAllHotelPolicies();
      res.json(policies);
    } catch (error) {
      res.status(500).json({ message: "Error fetching hotel policies" });
    }
  });

  // Get policy for a specific hotel
  app.get("/api/hotels/:hotelId/policy", async (req, res) => {
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

  // Get a specific policy by ID
  app.get("/api/hotel-policies/:id", async (req, res) => {
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

  // Create a hotel policy (admin only)
  app.post("/api/hotel-policies", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const validatedData = insertHotelPolicySchema.parse(req.body);

      // Check if hotel exists
      const hotel = await storage.getHotel(validatedData.hotelId);
      if (!hotel) {
        return res.status(400).json({ message: "Hotel not found" });
      }

      // Check if policy already exists for this hotel
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      res.status(500).json({ message: "Error creating hotel policy" });
    }
  });

  // Update a hotel policy (admin only)
  app.patch("/api/hotel-policies/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const policyId = parseInt(req.params.id);
      const validatedData = insertHotelPolicySchema.partial().parse(req.body);

      // If hotelId is provided, make sure hotel exists
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      res.status(500).json({ message: "Error updating hotel policy" });
    }
  });

  // Delete a hotel policy (admin only)
  app.delete("/api/hotel-policies/:id", async (req, res) => {
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

  // Site geneli tema ayarları - admin kullanıcılar için
  // Site çapında geçerli tema ayarı (normalde veritabanından okunur)
  let globalTheme = "classic";

  // Fiyat Kuralları API rotaları
  app.get("/api/price-rules", priceRulesRoutes.getAllPriceRules);
  app.get("/api/price-rules/:id", priceRulesRoutes.getPriceRuleById);
  app.get("/api/rooms/:roomId/price-rules", priceRulesRoutes.getPriceRulesByRoomId);

  // Admin korumalı fiyat kuralları API rotaları
  app.post("/api/price-rules", (req, res, next) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    next();
  }, priceRulesRoutes.createPriceRule);

  app.put("/api/price-rules/:id", (req, res, next) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    next();
  }, priceRulesRoutes.updatePriceRule);

  app.delete("/api/price-rules/:id", (req, res, next) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    next();
  }, priceRulesRoutes.deletePriceRule);

  /**
   * Site çapında tema ayarını getiren endpoint
   */
  app.get("/api/site-settings/theme", async (req, res) => {
    try {
      // Şu anda memory'de tuttuğumuz değeri döndürüyoruz
      // Gerçek uygulamada veritabanından okunmalı
      res.json({ theme: globalTheme });
    } catch (error) {
      res.status(500).json({ message: "Error fetching site theme settings" });
    }
  });

  /**
   * Site çapında tema ayarını güncelleyen endpoint (sadece admin kullanabilir)
   */
  app.post("/api/site-settings/theme", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    try {
      const { theme } = req.body;

      // Tema geçerliliğini kontrol et
      if (!theme || !["classic", "modern", "luxury", "coastal", "boutique"].includes(theme)) {
        return res.status(400).json({ message: "Invalid theme value" });
      }

      // Global tema değerini güncelle
      globalTheme = theme;

      console.log(`Site varsayılan teması değiştirildi: ${theme}`);

      res.json({
        success: true,
        message: "Site theme updated successfully",
        theme
      });
    } catch (error) {
      res.status(500).json({ message: "Error updating site theme settings" });
    }
  });

  /**
   * Dosya yükleme endpoint'i - sadece resim dosyaları için
   */
  app.post("/api/upload", upload.single('image'), (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Yüklenecek dosya bulunamadı" });
      }

      // Dosya URL'ini döndür
      const fileUrl = getFileUrl(req.file.filename);
      return res.status(201).json({
        message: "Dosya başarıyla yüklendi",
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          url: fileUrl,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    } catch (error) {
      console.error("Dosya yüklenirken hata:", error);
      return res.status(500).json({ message: "Dosya yüklenirken bir hata oluştu" });
    }
  });

  /**
   * Çoklu dosya yükleme endpoint'i - en fazla 10 resim dosyası için
   */
  app.post("/api/upload/multiple", upload.array('images', 10), (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "Yüklenecek dosya bulunamadı" });
      }

      // Dosya bilgilerini hazırla
      const uploadedFiles = files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        url: getFileUrl(file.filename),
        size: file.size,
        mimetype: file.mimetype
      }));

      return res.status(201).json({
        message: `${uploadedFiles.length} dosya başarıyla yüklendi`,
        files: uploadedFiles
      });
    } catch (error) {
      console.error("Çoklu dosya yüklenirken hata:", error);
      return res.status(500).json({ message: "Dosya yüklenirken bir hata oluştu" });
    }
  });

  // Page Content routes

  // Get all page contents
  app.get("/api/page-contents", async (req, res) => {
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

  // Get a specific page content by key
  app.get("/api/page-contents/:pageKey", async (req, res) => {
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

  // Admin protected route to create page content
  app.post("/api/page-contents", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const validatedData = insertPageContentSchema.parse(req.body);

      // Check if content with this key already exists
      const existingContent = await storage.getPageContent(validatedData.pageKey);
      if (existingContent) {
        return res.status(400).json({ message: "Page content with this key already exists" });
      }

      const pageContent = await storage.createPageContent(validatedData);
      res.status(201).json(pageContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
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

  // Admin protected route to update page content
  app.put("/api/page-contents/:pageKey", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const pageKey = req.params.pageKey;
      const validatedData = insertPageContentSchema.partial().parse(req.body);

      // Check if content exists
      const existingContent = await storage.getPageContent(pageKey);
      if (!existingContent) {
        return res.status(404).json({ message: "Page content not found" });
      }

      const updatedContent = await storage.updatePageContent(pageKey, validatedData);
      res.json(updatedContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
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

  // Admin protected route to delete page content
  app.delete("/api/page-contents/:pageKey", async (req, res) => {
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

  // PayTR API endpoints

  /**
   * PayTR ödeme başlatma endpoint'i
   */
  app.post("/api/payments/create-payment/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Bu işlem için giriş yapmalısınız" });
    }

    try {
      const reservationId = parseInt(req.params.id);
      const reservation = await storage.getReservation(reservationId);

      if (!reservation) {
        return res.status(404).json({ message: "Rezervasyon bulunamadı" });
      }

      if (reservation.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Bu rezervasyonu ödeme yetkiniz yok" });
      }

      // Önceden ödendi mi kontrolü
      if (reservation.paymentStatus === 'paid') {
        return res.status(400).json({ message: "Bu rezervasyon zaten ödenmiş" });
      }

      // Kullanıcı IP adresini al
      const userIp = req.headers['x-forwarded-for']?.toString() ||
        req.socket.remoteAddress ||
        '127.0.0.1';

      // Base URL oluştur
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;

      console.log('Ödeme başlatma bilgileri:', {
        reservationId,
        userIp,
        baseUrl,
        userPhone: req.user.phone
      });

      // PayTR token ve ödeme URL'sini al
      const result = await initiatePayment(
        reservationId,
        'credit_card',
        req.user.id,
        {
          userIp,
          baseUrl
        }
      );

      const { token, paymentUrl } = { token: result.token || '', paymentUrl: result.paymentUrl || '' };

      console.log('Ödeme başarıyla başlatıldı. Kullanıcı ödeme sayfasına yönlendiriliyor:', {
        token: token.substring(0, 10) + '...',
        paymentUrl
      });

      // Token ve ödeme URL'sini döndür - client bunu kullanarak kullanıcıyı yönlendirecek
      res.status(200).json({
        success: true,
        token,
        paymentUrl,
        message: "Ödeme başarıyla başlatıldı"
      });

    } catch (error: any) {
      console.error("Ödeme başlatma hatası:", error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // PayTR callback ve redirect endpoints are defined earlier in this file
  // See around line 964 for /api/payments/paytr-callback
  // See around line 979 for /api/payments/success 
  // See around line 989 for /api/payments/fail

  return httpServer;
}

