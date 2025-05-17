import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.ts";
import { setupVite, serveStatic, log } from "./vite";
import { getPublicDir } from "./utils/paths";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// __dirname tanımı (ESM için)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// CORS yapılandırması
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [ 
      'http://localhost:9060',
      'http://localhost:3000',
      'http://localhost:5000',
      null,
      undefined
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Helmet güvenlik ayarları
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

// Statik dosyalar
app.use(express.static(path.resolve(__dirname, "../dist/public")));

// API route'ları
registerRoutes(app);

// Anasayfa testi
//app.get("/", (req: Request, res: Response) => {
//  res.send("Hello World");
//});

// Fallback (SPA için)
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, "../dist/public/index.html"));
});

// Port ayarı ve başlatma
const PORT = process.env.PORT || 9060;
app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portunda çalışıyor...`);
});
