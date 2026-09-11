import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { Server as SocketIOServer } from "socket.io";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);
    socket.on("disconnect", () => console.log("Client disconnected", socket.id));
  });

  // File upload endpoint
  app.post("/api/upload", upload.single("photo"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  // Reports
  app.post(api.reports.create.path, async (req, res) => {
    try {
      console.log("[DEBUG] report body:", JSON.stringify(req.body));
      const input = api.reports.create.input.parse(req.body);
      console.log("[DEBUG] report parsed:", JSON.stringify(input));
      const report = await storage.createReport(input);
      io.emit("new_report", report);
      res.status(201).json(report);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      throw err;
    }
  });

  app.get(api.reports.list.path, async (req, res) => {
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;
    const reports = await storage.getReports(status, type);
    res.json(reports);
  });

  app.get(api.reports.get.path, async (req, res) => {
    const report = await storage.getReport(Number(req.params.id));
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.json(report);
  });

  app.patch(api.reports.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.reports.update.input.parse(req.body);
      const updated = await storage.updateReport(id, input);
      if (!updated) return res.status(404).json({ message: "Report not found" });
      io.emit("update_report", updated);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      throw err;
    }
  });

  // Auth
  app.post(api.auth.login.path, async (req, res) => {
    const { username, password } = req.body;
    if (username === "KUMBHMELA" && password === "CHOCOLATE") {
      return res.json({ id: 1, username: "KUMBHMELA", role: "volunteer", password: "" });
    }
    const user = await storage.getUserByUsername(username);
    if (user && user.password === password) return res.json(user);
    res.status(401).json({ message: "Invalid credentials" });
  });

  app.post(api.auth.logout.path, (_req, res) => res.json({ message: "Logged out" }));

  // Auto-expiry
  setInterval(async () => {
    const reports = await storage.getReports("active");
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    for (const report of reports) {
      if (now - new Date(report.createdAt).getTime() > ONE_HOUR) {
        await storage.updateReport(report.id, { status: "expired" });
        io.emit("report_expired", { id: report.id });
      }
    }
  }, 60 * 1000);

  // Seed
  async function seed() {
    const existing = await storage.getReports();
    if (existing.length === 0) {
      console.log("Seeding data...");
      await storage.createReport({ type: "medical", lat: 25.4358, lng: 81.8463, name: "Rahul Kumar", mobile: "9876543210", description: "Feeling dizzy, needs water", status: "active", age: 45, gender: "Male" });
      await storage.createReport({ type: "lost_other", lat: 25.4380, lng: 81.8400, name: "Sita Devi", age: 60, gender: "Female", description: "Wearing red saree, last seen near Sangam", status: "active" });
      await storage.createUser({ username: "KUMBHMELA", password: "CHOCOLATE", role: "volunteer" });
    }
  }
  seed();

  return httpServer;
}
