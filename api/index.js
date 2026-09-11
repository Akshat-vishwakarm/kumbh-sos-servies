var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default;
var init_vite_config = __esm({
  async "vite.config.ts"() {
    "use strict";
    vite_config_default = defineConfig({
      plugins: [
        react(),
        runtimeErrorOverlay(),
        ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
          await import("@replit/vite-plugin-cartographer").then(
            (m) => m.cartographer()
          ),
          await import("@replit/vite-plugin-dev-banner").then(
            (m) => m.devBanner()
          )
        ] : []
      ],
      resolve: {
        alias: {
          "@": path3.resolve(import.meta.dirname, "client", "src"),
          "@shared": path3.resolve(import.meta.dirname, "shared"),
          "@assets": path3.resolve(import.meta.dirname, "attached_assets")
        }
      },
      root: path3.resolve(import.meta.dirname, "client"),
      build: {
        outDir: path3.resolve(import.meta.dirname, "dist/public"),
        emptyOutDir: true
      },
      server: {
        fs: {
          strict: true,
          deny: ["**/.*"]
        }
      }
    });
  }
});

// server/vite.ts
var vite_exports = {};
__export(vite_exports, {
  setupVite: () => setupVite
});
import { createServer as createViteServer, createLogger } from "vite";
import fs3 from "fs";
import path4 from "path";
import { nanoid } from "nanoid";
async function setupVite(server, app2) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
var viteLogger;
var init_vite = __esm({
  async "server/vite.ts"() {
    "use strict";
    await init_vite_config();
    viteLogger = createLogger();
  }
});

// server/index.ts
import express2 from "express";

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  REPORT_STATUS: () => REPORT_STATUS,
  REPORT_TYPES: () => REPORT_TYPES,
  insertReportSchema: () => insertReportSchema,
  insertUserSchema: () => insertUserSchema,
  reports: () => reports,
  users: () => users
});
import { pgTable, text, serial, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var REPORT_TYPES = ["medical", "lost_self", "lost_other", "volunteer"];
var REPORT_STATUS = ["active", "resolved", "expired"];
var reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: REPORT_TYPES }).notNull(),
  name: text("name"),
  mobile: text("mobile"),
  age: integer("age"),
  gender: text("gender"),
  description: text("description"),
  // For "Last seen note" or general details
  photoUrl: text("photo_url"),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  status: text("status", { enum: REPORT_STATUS }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull()
});
var insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  lastSeenAt: true,
  status: true
}).extend({
  lat: z.number(),
  lng: z.number(),
  age: z.coerce.number().optional(),
  photoUrl: z.string().optional(),
  gender: z.string().optional()
});
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("volunteer").notNull()
});
var insertUserSchema = createInsertSchema(users).omit({ id: true });

// server/db.ts
var { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, and, gt } from "drizzle-orm";
var DatabaseStorage = class {
  async createReport(insertReport) {
    const [report] = await db.insert(reports).values(insertReport).returning();
    return report;
  }
  async getReport(id) {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }
  async getReports(status) {
    if (status) {
      return await db.select().from(reports).where(eq(reports.status, status));
    }
    return await db.select().from(reports);
  }
  async updateReport(id, updates) {
    const [updated] = await db.update(reports).set({ ...updates, lastSeenAt: /* @__PURE__ */ new Date() }).where(eq(reports.id, id)).returning();
    return updated;
  }
  async deleteExpiredReports() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1e3);
    await db.update(reports).set({ status: "expired" }).where(and(eq(reports.status, "active"), gt(reports.lastSeenAt, oneHourAgo) === false));
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
};
var storage = new DatabaseStorage();

// shared/routes.ts
import { z as z2 } from "zod";
var errorSchemas = {
  validation: z2.object({
    message: z2.string(),
    field: z2.string().optional()
  }),
  notFound: z2.object({
    message: z2.string()
  }),
  internal: z2.object({
    message: z2.string()
  }),
  unauthorized: z2.object({
    message: z2.string()
  })
};
var api = {
  reports: {
    create: {
      method: "POST",
      path: "/api/reports",
      input: insertReportSchema,
      responses: {
        201: z2.custom(),
        400: errorSchemas.validation
      }
    },
    list: {
      method: "GET",
      path: "/api/reports",
      input: z2.object({
        status: z2.enum(["active", "resolved", "expired"]).optional(),
        type: z2.string().optional()
      }).optional(),
      responses: {
        200: z2.array(z2.custom())
      }
    },
    get: {
      method: "GET",
      path: "/api/reports/:id",
      responses: {
        200: z2.custom(),
        404: errorSchemas.notFound
      }
    },
    update: {
      method: "PATCH",
      path: "/api/reports/:id",
      input: insertReportSchema.partial().extend({
        status: z2.enum(["active", "resolved", "expired"]).optional()
      }),
      responses: {
        200: z2.custom(),
        404: errorSchemas.notFound
      }
    }
  },
  auth: {
    login: {
      method: "POST",
      path: "/api/auth/login",
      input: z2.object({
        username: z2.string(),
        password: z2.string()
      }),
      responses: {
        200: z2.custom(),
        401: errorSchemas.unauthorized
      }
    },
    logout: {
      method: "POST",
      path: "/api/auth/logout",
      responses: {
        200: z2.object({ message: z2.string() })
      }
    }
  }
};

// server/routes.ts
import { z as z3 } from "zod";
import { Server as SocketIOServer } from "socket.io";
import multer from "multer";
import path from "path";
import fs from "fs";
var uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
var upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    }
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  }
});
async function registerRoutes(httpServer2, app2) {
  const io = new SocketIOServer(httpServer2, {
    path: "/socket.io",
    cors: { origin: "*", methods: ["GET", "POST"] }
  });
  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);
    socket.on("disconnect", () => console.log("Client disconnected", socket.id));
  });
  app2.post("/api/upload", upload.single("photo"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });
  app2.post(api.reports.create.path, async (req, res) => {
    try {
      console.log("[DEBUG] report body:", JSON.stringify(req.body));
      const input = api.reports.create.input.parse(req.body);
      console.log("[DEBUG] report parsed:", JSON.stringify(input));
      const report = await storage.createReport(input);
      io.emit("new_report", report);
      res.status(201).json(report);
    } catch (err) {
      if (err instanceof z3.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      throw err;
    }
  });
  app2.get(api.reports.list.path, async (req, res) => {
    const status = req.query.status;
    const type = req.query.type;
    const reports3 = await storage.getReports(status, type);
    res.json(reports3);
  });
  app2.get(api.reports.get.path, async (req, res) => {
    const report = await storage.getReport(Number(req.params.id));
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.json(report);
  });
  app2.patch(api.reports.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.reports.update.input.parse(req.body);
      const updated = await storage.updateReport(id, input);
      if (!updated) return res.status(404).json({ message: "Report not found" });
      io.emit("update_report", updated);
      res.json(updated);
    } catch (err) {
      if (err instanceof z3.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      throw err;
    }
  });
  app2.post(api.auth.login.path, async (req, res) => {
    const { username, password } = req.body;
    if (username === "KUMBHMELA" && password === "CHOCOLATE") {
      return res.json({ id: 1, username: "KUMBHMELA", role: "volunteer", password: "" });
    }
    const user = await storage.getUserByUsername(username);
    if (user && user.password === password) return res.json(user);
    res.status(401).json({ message: "Invalid credentials" });
  });
  app2.post(api.auth.logout.path, (_req, res) => res.json({ message: "Logged out" }));
  setInterval(async () => {
    const reports3 = await storage.getReports("active");
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1e3;
    for (const report of reports3) {
      if (now - new Date(report.createdAt).getTime() > ONE_HOUR) {
        await storage.updateReport(report.id, { status: "expired" });
        io.emit("report_expired", { id: report.id });
      }
    }
  }, 60 * 1e3);
  async function seed() {
    const existing = await storage.getReports();
    if (existing.length === 0) {
      console.log("Seeding data...");
      await storage.createReport({ type: "medical", lat: 25.4358, lng: 81.8463, name: "Rahul Kumar", mobile: "9876543210", description: "Feeling dizzy, needs water", status: "active", age: 45, gender: "Male" });
      await storage.createReport({ type: "lost_other", lat: 25.438, lng: 81.84, name: "Sita Devi", age: 60, gender: "Female", description: "Wearing red saree, last seen near Sangam", status: "active" });
      await storage.createUser({ username: "KUMBHMELA", password: "CHOCOLATE", role: "volunteer" });
    }
  }
  seed();
  return httpServer2;
}

// server/static.ts
import express from "express";
import fs2 from "fs";
import path2 from "path";
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import { createServer } from "http";
import path5 from "path";
var app = express2();
var httpServer = createServer(app);
app.use(
  express2.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express2.urlencoded({ extended: false }));
app.use("/uploads", express2.static(path5.join(process.cwd(), "uploads")));
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
app.use((req, res, next) => {
  const start = Date.now();
  const path6 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path6.startsWith("/api")) {
      let logLine = `${req.method} ${path6} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  await registerRoutes(httpServer, app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite: setupVite2 } = await init_vite().then(() => vite_exports);
    await setupVite2(httpServer, app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
export {
  log
};
