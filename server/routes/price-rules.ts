import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

// Price rule veri modelini tanımlama
const priceRuleSchema = z.object({
  roomId: z.number(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  priceModifier: z.number().min(-99).max(300),
  ruleName: z.string().min(2),
  ruleType: z.enum(['seasonal', 'weekend', 'holiday', 'special']),
  isActive: z.boolean().default(true),
});

type PriceRule = z.infer<typeof priceRuleSchema> & { id: number };

// Geçici depolama için (veritabanı yapılana kadar)
let priceRules: PriceRule[] = [
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
    ruleName: "Yılbaşı Özel",
    ruleType: "holiday",
    isActive: true
  },
  {
    id: 4,
    roomId: 3,
    startDate: "2025-05-01",
    endDate: "2025-05-31",
    priceModifier: -15,
    ruleName: "Mayıs İndirimi",
    ruleType: "special",
    isActive: true
  },
  {
    id: 5,
    roomId: 4,
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    priceModifier: 25,
    ruleName: "Hafta Sonu Fiyatı",
    ruleType: "weekend",
    isActive: true
  }
];

// Tüm fiyat kurallarını getir
export const getAllPriceRules = async (req: Request, res: Response) => {
  try {
    res.status(200).json(priceRules);
  } catch (error) {
    console.error("Error getting price rules:", error);
    res.status(500).json({ error: "Fiyat kuralları alınırken bir hata oluştu" });
  }
};

// Belirli bir fiyat kuralını getir
export const getPriceRuleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const priceRule = priceRules.find(rule => rule.id === parseInt(id));
    
    if (!priceRule) {
      return res.status(404).json({ error: "Fiyat kuralı bulunamadı" });
    }
    
    res.status(200).json(priceRule);
  } catch (error) {
    console.error("Error getting price rule:", error);
    res.status(500).json({ error: "Fiyat kuralı alınırken bir hata oluştu" });
  }
};

// Yeni fiyat kuralı oluştur
export const createPriceRule = async (req: Request, res: Response) => {
  try {
    // Gelen veriyi doğrula
    const validatedData = priceRuleSchema.parse(req.body);
    
    // Yeni kural oluştur
    const newPriceRule: PriceRule = {
      ...validatedData,
      id: priceRules.length > 0 ? Math.max(...priceRules.map(rule => rule.id)) + 1 : 1
    };
    
    // Kurallar listesine ekle
    priceRules.push(newPriceRule);
    
    res.status(201).json(newPriceRule);
  } catch (error) {
    console.error("Error creating price rule:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Geçersiz veri formatı", details: error.errors });
    }
    res.status(500).json({ error: "Fiyat kuralı oluşturulurken bir hata oluştu" });
  }
};

// Fiyat kuralını güncelle
export const updatePriceRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ruleId = parseInt(id);
    
    // Kuralın varlığını kontrol et
    const priceRuleIndex = priceRules.findIndex(rule => rule.id === ruleId);
    if (priceRuleIndex === -1) {
      return res.status(404).json({ error: "Fiyat kuralı bulunamadı" });
    }
    
    // Gelen veriyi doğrula
    const validatedData = priceRuleSchema.parse(req.body);
    
    // Kuralı güncelle
    priceRules[priceRuleIndex] = {
      ...validatedData,
      id: ruleId
    };
    
    res.status(200).json(priceRules[priceRuleIndex]);
  } catch (error) {
    console.error("Error updating price rule:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Geçersiz veri formatı", details: error.errors });
    }
    res.status(500).json({ error: "Fiyat kuralı güncellenirken bir hata oluştu" });
  }
};

// Fiyat kuralını sil
export const deletePriceRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ruleId = parseInt(id);
    
    // Kuralın varlığını kontrol et
    const initialLength = priceRules.length;
    priceRules = priceRules.filter(rule => rule.id !== ruleId);
    
    if (priceRules.length === initialLength) {
      return res.status(404).json({ error: "Fiyat kuralı bulunamadı" });
    }
    
    res.status(200).json({ message: "Fiyat kuralı başarıyla silindi" });
  } catch (error) {
    console.error("Error deleting price rule:", error);
    res.status(500).json({ error: "Fiyat kuralı silinirken bir hata oluştu" });
  }
};

// Belirli bir odanın fiyat kurallarını getir
export const getPriceRulesByRoomId = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const roomRules = priceRules.filter(rule => rule.roomId === parseInt(roomId));
    
    res.status(200).json(roomRules);
  } catch (error) {
    console.error("Error getting room price rules:", error);
    res.status(500).json({ error: "Oda fiyat kuralları alınırken bir hata oluştu" });
  }
};

// Belirli bir tarihteki fiyat hesaplama fonksiyonu
// Bu fonksiyon API'ye eklenirse, belirli bir tarih için odanın gerçek fiyatını hesaplar
export const calculateRoomPrice = (roomBasePrice: number, roomId: number, date: Date): number => {
  let finalPrice = roomBasePrice;
  
  // İlgili odaya ait aktif fiyat kurallarını bul
  const applicableRules = priceRules.filter(rule => {
    if (rule.roomId !== roomId || !rule.isActive) return false;
    
    const startDate = new Date(rule.startDate);
    const endDate = new Date(rule.endDate);
    
    return date >= startDate && date <= endDate;
  });
  
  // Kuralları uygula
  applicableRules.forEach(rule => {
    finalPrice += (finalPrice * rule.priceModifier / 100);
  });
  
  return Math.round(finalPrice);
};

// Bu router'ın içe aktarılmasını kolaylaştırmak için bir nesne döndürüyoruz
export const priceRulesRoutes = {
  getAllPriceRules,
  getPriceRuleById,
  createPriceRule,
  updatePriceRule,
  deletePriceRule,
  getPriceRulesByRoomId
};