import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    is_admin INTEGER DEFAULT 0,
    has_access INTEGER DEFAULT 0
  )
`);

// Add default admins if they don't exist
const admins = ["elhaooari@gmail.com", "abderrahim6boukdir@gmail.com"];
const insertUser = db.prepare("INSERT OR IGNORE INTO users (email, password, is_admin, has_access) VALUES (?, ?, ?, ?)");
admins.forEach(email => {
  insertUser.run(email, "admin123", 1, 1);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth API
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
    
    if (user) {
      if (user.has_access === 1 || user.is_admin === 1) {
        res.json({ success: true, user: { email: user.email, isAdmin: !!user.is_admin } });
      } else {
        res.status(403).json({ success: false, message: "Access denied. Please contact an admin." });
      }
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password." });
    }
  });

  // Admin APIs
  app.get("/api/admin/users", (req, res) => {
    const adminEmail = req.headers["x-admin-email"];
    const admin = db.prepare("SELECT * FROM users WHERE email = ? AND is_admin = 1").get(adminEmail) as any;
    
    if (!admin) return res.status(403).json({ error: "Unauthorized" });

    const users = db.prepare("SELECT id, email, is_admin, has_access FROM users").all();
    res.json(users);
  });

  app.post("/api/admin/toggle-access", (req, res) => {
    const adminEmail = req.headers["x-admin-email"];
    const admin = db.prepare("SELECT * FROM users WHERE email = ? AND is_admin = 1").get(adminEmail) as any;
    
    if (!admin) return res.status(403).json({ error: "Unauthorized" });

    const { userId, hasAccess } = req.body;
    db.prepare("UPDATE users SET has_access = ? WHERE id = ?").run(hasAccess ? 1 : 0, userId);
    res.json({ success: true });
  });

  app.post("/api/admin/add-user", (req, res) => {
    const adminEmail = req.headers["x-admin-email"];
    const admin = db.prepare("SELECT * FROM users WHERE email = ? AND is_admin = 1").get(adminEmail) as any;
    
    if (!admin) return res.status(403).json({ error: "Unauthorized" });

    const { email, password } = req.body;
    try {
      db.prepare("INSERT INTO users (email, password, has_access) VALUES (?, ?, 1)").run(email, password);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "User already exists" });
    }
  });

  app.post("/api/admin/delete-user", (req, res) => {
    const adminEmail = req.headers["x-admin-email"];
    const admin = db.prepare("SELECT * FROM users WHERE email = ? AND is_admin = 1").get(adminEmail) as any;
    
    if (!admin) return res.status(403).json({ error: "Unauthorized" });

    const { userId } = req.body;
    db.prepare("DELETE FROM users WHERE id = ? AND is_admin = 0").run(userId);
    res.json({ success: true });
  });

  // User APIs
  app.post("/api/change-password", (req, res) => {
    const { email, oldPassword, newPassword } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, oldPassword);
    
    if (user) {
      db.prepare("UPDATE users SET password = ? WHERE email = ?").run(newPassword, email);
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Incorrect current password." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
