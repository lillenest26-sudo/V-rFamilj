// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
  date
} from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var familyMembers = mysqlTable("family_members", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  role: mysqlEnum("role", ["parent", "child"]).default("child").notNull(),
  imageUrl: text("imageUrl"),
  color: varchar("color", { length: 32 }).default("#6366f1"),
  birthday: date("birthday"),
  notes: text("notes"),
  points: int("points").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime"),
  allDay: boolean("allDay").default(false),
  color: varchar("color", { length: 32 }).default("#6366f1"),
  icon: varchar("icon", { length: 64 }),
  location: varchar("location", { length: 256 }),
  category: varchar("category", { length: 64 }).default("general"),
  recurrence: mysqlEnum("recurrence", ["none", "daily", "weekly", "monthly", "yearly"]).default("none"),
  assignedTo: json("assignedTo").$type(),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_progress", "done"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  dueDate: timestamp("dueDate"),
  assignedTo: int("assignedTo"),
  category: varchar("category", { length: 64 }),
  points: int("points").default(0),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var reminders = mysqlTable("reminders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  remindAt: timestamp("remindAt").notNull(),
  type: mysqlEnum("type", ["normal", "important", "urgent"]).default("normal").notNull(),
  done: boolean("done").default(false),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var mealPlans = mysqlTable("meal_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  weekStart: date("weekStart").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(),
  // 0=Mon … 6=Sun
  mealType: mysqlEnum("mealType", ["breakfast", "lunch", "dinner", "snack"]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  recipe: text("recipe"),
  imageUrl: text("imageUrl"),
  ingredients: json("ingredients").$type(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var shoppingItems = mysqlTable("shopping_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  category: mysqlEnum("category", ["fruit", "vegetable", "meat", "dairy", "bread", "drink", "other"]).default("other").notNull(),
  quantity: varchar("quantity", { length: 64 }),
  price: decimal("price", { precision: 10, scale: 2 }),
  bought: boolean("bought").default(false),
  fromMealPlan: boolean("fromMealPlan").default(false),
  weekStart: date("weekStart"),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  description: text("description"),
  date: date("date").notNull(),
  receiptUrl: text("receiptUrl"),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var savingsGoals = mysqlTable("savings_goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  targetAmount: decimal("targetAmount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal("currentAmount", { precision: 12, scale: 2 }).default("0"),
  icon: varchar("icon", { length: 64 }),
  color: varchar("color", { length: 32 }).default("#6366f1"),
  deadline: date("deadline"),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var albums = mysqlTable("albums", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  coverUrl: text("coverUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var photos = mysqlTable("photos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  albumId: int("albumId"),
  url: text("url").notNull(),
  fileKey: text("fileKey").notNull(),
  caption: text("caption"),
  takenAt: timestamp("takenAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  url: text("url").notNull(),
  fileKey: text("fileKey").notNull(),
  mimeType: varchar("mimeType", { length: 128 }),
  folder: varchar("folder", { length: 128 }).default("general"),
  size: int("size"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var diaryEntries = mysqlTable("diary_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  memberId: int("memberId"),
  title: varchar("title", { length: 256 }),
  content: text("content").notNull(),
  mood: mysqlEnum("mood", ["happy", "neutral", "sad", "excited", "tired"]).default("neutral"),
  imageUrl: text("imageUrl"),
  entryDate: date("entryDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var familyGoals = mysqlTable("family_goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }),
  targetDate: date("targetDate"),
  completed: boolean("completed").default(false),
  progress: int("progress").default(0),
  // 0–100
  icon: varchar("icon", { length: 64 }),
  color: varchar("color", { length: 32 }).default("#6366f1"),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var rewards = mysqlTable("rewards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  memberId: int("memberId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  pointsCost: int("pointsCost").notNull(),
  icon: varchar("icon", { length: 64 }),
  imageUrl: text("imageUrl"),
  unlocked: boolean("unlocked").default(false),
  unlockedAt: timestamp("unlockedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var pointTransactions = mysqlTable("point_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  memberId: int("memberId").notNull(),
  points: int("points").notNull(),
  reason: varchar("reason", { length: 256 }),
  taskId: int("taskId"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z2 } from "zod";
import { eq as eq2, and, desc, asc, gte, lte, sql } from "drizzle-orm";

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
var RETRY_MAX_RETRIES = 4;
var RETRY_BASE_DELAY_MS = 500;
var RETRY_MAX_DELAY_MS = 3e4;
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var parseRetryAfter = (value) => {
  if (!value) return void 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1e3);
  const at = Date.parse(value);
  return Number.isNaN(at) ? void 0 : Math.max(0, at - Date.now());
};
var computeBackoffDelay = (attempt, retryAfterMs) => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};
var fetchWithBackoff = async (url, init) => {
  let lastError;
  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || attempt === RETRY_MAX_RETRIES) {
        return response;
      }
      const retryAfterMs = parseRetryAfter(
        response.headers.get("retry-after")
      );
      try {
        await response.body?.cancel();
      } catch {
      }
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after status ${response.status}`
      );
      await sleep(computeBackoffDelay(attempt, retryAfterMs));
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_MAX_RETRIES) throw error;
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after network error`
      );
      await sleep(computeBackoffDelay(attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("LLM request failed after exhausting retries");
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model,
    thinking,
    reasoning,
    maxTokens,
    max_tokens
  } = params;
  const payload = {
    messages: messages.map(normalizeMessage)
  };
  if (model) {
    payload.model = model;
  }
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  const resolvedMaxTokens = max_tokens ?? maxTokens;
  if (typeof resolvedMaxTokens === "number") {
    payload.max_tokens = resolvedMaxTokens;
  }
  if (thinking) {
    payload.thinking = thinking;
  }
  if (reasoning) {
    payload.reasoning = reasoning;
  }
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetchWithBackoff(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/storage.ts
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
var calendarRouter = router({
  list: protectedProcedure.input(z2.object({ limit: z2.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const now = /* @__PURE__ */ new Date();
    const q = db.select().from(calendarEvents).where(and(eq2(calendarEvents.userId, ctx.user.id), gte(calendarEvents.startTime, now))).orderBy(asc(calendarEvents.startTime)).limit(input?.limit ?? 50);
    return q;
  }),
  listAll: protectedProcedure.input(z2.object({ start: z2.string().optional(), end: z2.string().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    let q = db.select().from(calendarEvents).where(eq2(calendarEvents.userId, ctx.user.id)).orderBy(asc(calendarEvents.startTime));
    return q;
  }),
  create: protectedProcedure.input(z2.object({
    title: z2.string().min(1),
    description: z2.string().optional(),
    startTime: z2.string(),
    endTime: z2.string().optional(),
    allDay: z2.boolean().optional(),
    color: z2.string().optional(),
    icon: z2.string().optional(),
    location: z2.string().optional(),
    category: z2.string().optional(),
    recurrence: z2.enum(["none", "daily", "weekly", "monthly", "yearly"]).optional(),
    assignedTo: z2.array(z2.number()).optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(calendarEvents).values({
      userId: ctx.user.id,
      title: input.title,
      description: input.description,
      startTime: new Date(input.startTime),
      endTime: input.endTime ? new Date(input.endTime) : void 0,
      allDay: input.allDay ?? false,
      color: input.color ?? "#6366f1",
      icon: input.icon,
      location: input.location,
      category: input.category ?? "general",
      recurrence: input.recurrence ?? "none",
      assignedTo: input.assignedTo ?? [],
      imageUrl: input.imageUrl
    });
    return { success: true };
  }),
  update: protectedProcedure.input(z2.object({
    id: z2.number(),
    title: z2.string().optional(),
    description: z2.string().optional(),
    startTime: z2.string().optional(),
    endTime: z2.string().optional(),
    allDay: z2.boolean().optional(),
    color: z2.string().optional(),
    location: z2.string().optional(),
    category: z2.string().optional(),
    recurrence: z2.enum(["none", "daily", "weekly", "monthly", "yearly"]).optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    const { id, startTime, endTime, ...rest } = input;
    const updateData = { ...rest };
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    await db.update(calendarEvents).set(updateData).where(and(eq2(calendarEvents.id, id), eq2(calendarEvents.userId, ctx.user.id)));
    return { success: true };
  }),
  delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(calendarEvents).where(and(eq2(calendarEvents.id, input.id), eq2(calendarEvents.userId, ctx.user.id)));
    return { success: true };
  })
});
var tasksRouter = router({
  list: protectedProcedure.input(z2.object({ status: z2.string().optional(), limit: z2.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(tasks).where(eq2(tasks.userId, ctx.user.id)).orderBy(desc(tasks.createdAt)).limit(input?.limit ?? 100);
  }),
  create: protectedProcedure.input(z2.object({
    title: z2.string().min(1),
    description: z2.string().optional(),
    priority: z2.enum(["low", "medium", "high", "urgent"]).optional(),
    dueDate: z2.string().optional(),
    assignedTo: z2.number().optional(),
    category: z2.string().optional(),
    points: z2.number().optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(tasks).values({
      userId: ctx.user.id,
      title: input.title,
      description: input.description,
      priority: input.priority ?? "medium",
      dueDate: input.dueDate ? new Date(input.dueDate) : void 0,
      assignedTo: input.assignedTo,
      category: input.category,
      points: input.points ?? 0,
      imageUrl: input.imageUrl,
      status: "pending"
    });
    return { success: true };
  }),
  update: protectedProcedure.input(z2.object({
    id: z2.number(),
    title: z2.string().optional(),
    description: z2.string().optional(),
    status: z2.enum(["pending", "in_progress", "done"]).optional(),
    priority: z2.enum(["low", "medium", "high", "urgent"]).optional(),
    dueDate: z2.string().optional(),
    assignedTo: z2.number().optional(),
    category: z2.string().optional(),
    points: z2.number().optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    const { id, dueDate, ...rest } = input;
    const updateData = { ...rest };
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (rest.status === "done") {
      const [task] = await db.select().from(tasks).where(and(eq2(tasks.id, id), eq2(tasks.userId, ctx.user.id)));
      if (task?.assignedTo && task.points && task.points > 0) {
        await db.update(familyMembers).set({ points: sql`${familyMembers.points} + ${task.points}` }).where(eq2(familyMembers.id, task.assignedTo));
        await db.insert(pointTransactions).values({
          userId: ctx.user.id,
          memberId: task.assignedTo,
          points: task.points,
          reason: `Task completed: ${task.title}`,
          taskId: id
        });
      }
    }
    await db.update(tasks).set(updateData).where(and(eq2(tasks.id, id), eq2(tasks.userId, ctx.user.id)));
    return { success: true };
  }),
  delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(tasks).where(and(eq2(tasks.id, input.id), eq2(tasks.userId, ctx.user.id)));
    return { success: true };
  })
});
var remindersRouter = router({
  today: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const start = /* @__PURE__ */ new Date();
    start.setHours(0, 0, 0, 0);
    const end = /* @__PURE__ */ new Date();
    end.setHours(23, 59, 59, 999);
    return db.select().from(reminders).where(and(eq2(reminders.userId, ctx.user.id), gte(reminders.remindAt, start), lte(reminders.remindAt, end))).orderBy(asc(reminders.remindAt));
  }),
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(reminders).where(eq2(reminders.userId, ctx.user.id)).orderBy(asc(reminders.remindAt));
  }),
  create: protectedProcedure.input(z2.object({
    title: z2.string().min(1),
    description: z2.string().optional(),
    remindAt: z2.string(),
    type: z2.enum(["normal", "important", "urgent"]).optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(reminders).values({
      userId: ctx.user.id,
      title: input.title,
      description: input.description,
      remindAt: new Date(input.remindAt),
      type: input.type ?? "normal",
      imageUrl: input.imageUrl
    });
    return { success: true };
  }),
  update: protectedProcedure.input(z2.object({
    id: z2.number(),
    done: z2.boolean().optional(),
    title: z2.string().optional(),
    remindAt: z2.string().optional(),
    type: z2.enum(["normal", "important", "urgent"]).optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    const { id, remindAt, ...rest } = input;
    const updateData = { ...rest };
    if (remindAt) updateData.remindAt = new Date(remindAt);
    await db.update(reminders).set(updateData).where(and(eq2(reminders.id, id), eq2(reminders.userId, ctx.user.id)));
    return { success: true };
  }),
  delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(reminders).where(and(eq2(reminders.id, input.id), eq2(reminders.userId, ctx.user.id)));
    return { success: true };
  })
});
var mealPlanRouter = router({
  list: protectedProcedure.input(z2.object({ weekStart: z2.string() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(mealPlans).where(and(eq2(mealPlans.userId, ctx.user.id), eq2(mealPlans.weekStart, new Date(input.weekStart)))).orderBy(asc(mealPlans.dayOfWeek));
  }),
  create: protectedProcedure.input(z2.object({
    weekStart: z2.string(),
    dayOfWeek: z2.number().min(0).max(6),
    mealType: z2.enum(["breakfast", "lunch", "dinner", "snack"]),
    title: z2.string().min(1),
    description: z2.string().optional(),
    recipe: z2.string().optional(),
    ingredients: z2.array(z2.string()).optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(mealPlans).values({
      userId: ctx.user.id,
      weekStart: new Date(input.weekStart),
      dayOfWeek: input.dayOfWeek,
      mealType: input.mealType,
      title: input.title,
      description: input.description,
      recipe: input.recipe,
      ingredients: input.ingredients ?? [],
      imageUrl: input.imageUrl
    });
    return { success: true };
  }),
  update: protectedProcedure.input(z2.object({
    id: z2.number(),
    title: z2.string().optional(),
    description: z2.string().optional(),
    recipe: z2.string().optional(),
    ingredients: z2.array(z2.string()).optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    const { id, ...rest } = input;
    await db.update(mealPlans).set(rest).where(and(eq2(mealPlans.id, id), eq2(mealPlans.userId, ctx.user.id)));
    return { success: true };
  }),
  delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(mealPlans).where(and(eq2(mealPlans.id, input.id), eq2(mealPlans.userId, ctx.user.id)));
    return { success: true };
  }),
  generateShoppingList: protectedProcedure.input(z2.object({ weekStart: z2.string() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    const meals = await db.select().from(mealPlans).where(and(eq2(mealPlans.userId, ctx.user.id), eq2(mealPlans.weekStart, new Date(input.weekStart))));
    await db.delete(shoppingItems).where(and(eq2(shoppingItems.userId, ctx.user.id), eq2(shoppingItems.fromMealPlan, true), eq2(shoppingItems.weekStart, new Date(input.weekStart))));
    const allIngredients = [];
    for (const meal of meals) {
      if (meal.ingredients && Array.isArray(meal.ingredients)) {
        allIngredients.push(...meal.ingredients);
      }
    }
    const uniqueSet = new Set(allIngredients);
    const unique = Array.from(uniqueSet);
    for (const ingredient of unique) {
      await db.insert(shoppingItems).values({
        userId: ctx.user.id,
        name: ingredient,
        category: "other",
        fromMealPlan: true,
        weekStart: new Date(input.weekStart)
      });
    }
    return { count: unique.length };
  })
});
var shoppingRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(shoppingItems).where(eq2(shoppingItems.userId, ctx.user.id)).orderBy(asc(shoppingItems.category), asc(shoppingItems.name));
  }),
  create: protectedProcedure.input(z2.object({
    name: z2.string().min(1),
    category: z2.enum(["fruit", "vegetable", "meat", "dairy", "bread", "drink", "other"]).optional(),
    quantity: z2.string().optional(),
    price: z2.string().optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(shoppingItems).values({
      userId: ctx.user.id,
      name: input.name,
      category: input.category ?? "other",
      quantity: input.quantity,
      price: input.price,
      imageUrl: input.imageUrl
    });
    return { success: true };
  }),
  toggle: protectedProcedure.input(z2.object({ id: z2.number(), bought: z2.boolean() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(shoppingItems).set({ bought: input.bought }).where(and(eq2(shoppingItems.id, input.id), eq2(shoppingItems.userId, ctx.user.id)));
    return { success: true };
  }),
  delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(shoppingItems).where(and(eq2(shoppingItems.id, input.id), eq2(shoppingItems.userId, ctx.user.id)));
    return { success: true };
  }),
  clearBought: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(shoppingItems).where(and(eq2(shoppingItems.userId, ctx.user.id), eq2(shoppingItems.bought, true)));
    return { success: true };
  })
});
var budgetRouter = router({
  transactions: protectedProcedure.input(z2.object({ month: z2.string().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(transactions).where(eq2(transactions.userId, ctx.user.id)).orderBy(desc(transactions.date));
  }),
  addTransaction: protectedProcedure.input(z2.object({
    type: z2.enum(["income", "expense"]),
    amount: z2.string(),
    category: z2.string(),
    description: z2.string().optional(),
    date: z2.string(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(transactions).values({
      userId: ctx.user.id,
      type: input.type,
      amount: input.amount,
      category: input.category,
      description: input.description,
      date: new Date(input.date),
      imageUrl: input.imageUrl
    });
    return { success: true };
  }),
  updateTransaction: protectedProcedure.input(z2.object({
    id: z2.number(),
    type: z2.enum(["income", "expense"]).optional(),
    amount: z2.string().optional(),
    category: z2.string().optional(),
    description: z2.string().optional(),
    date: z2.string().optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    const { id, ...rest } = input;
    const updateData = {};
    if (rest.type) updateData.type = rest.type;
    if (rest.amount) updateData.amount = rest.amount;
    if (rest.category) updateData.category = rest.category;
    if (rest.description !== void 0) updateData.description = rest.description;
    if (rest.date) updateData.date = new Date(rest.date);
    if (rest.imageUrl !== void 0) updateData.imageUrl = rest.imageUrl;
    await db.update(transactions).set(updateData).where(and(eq2(transactions.id, id), eq2(transactions.userId, ctx.user.id)));
    return { success: true };
  }),
  deleteTransaction: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(transactions).where(and(eq2(transactions.id, input.id), eq2(transactions.userId, ctx.user.id)));
    return { success: true };
  }),
  savingsGoals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(savingsGoals).where(eq2(savingsGoals.userId, ctx.user.id)).orderBy(desc(savingsGoals.createdAt));
  }),
  createSavingsGoal: protectedProcedure.input(z2.object({
    title: z2.string().min(1),
    targetAmount: z2.string(),
    currentAmount: z2.string().optional(),
    icon: z2.string().optional(),
    color: z2.string().optional(),
    deadline: z2.string().optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(savingsGoals).values({
      userId: ctx.user.id,
      title: input.title,
      targetAmount: input.targetAmount,
      currentAmount: input.currentAmount ?? "0",
      icon: input.icon,
      color: input.color ?? "#6366f1",
      deadline: input.deadline ? new Date(input.deadline) : void 0,
      imageUrl: input.imageUrl
    });
    return { success: true };
  }),
  updateSavingsGoal: protectedProcedure.input(z2.object({
    id: z2.number(),
    currentAmount: z2.string().optional(),
    title: z2.string().optional(),
    targetAmount: z2.string().optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    const { id, ...rest } = input;
    await db.update(savingsGoals).set(rest).where(and(eq2(savingsGoals.id, id), eq2(savingsGoals.userId, ctx.user.id)));
    return { success: true };
  }),
  deleteSavingsGoal: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(savingsGoals).where(and(eq2(savingsGoals.id, input.id), eq2(savingsGoals.userId, ctx.user.id)));
    return { success: true };
  })
});
var familyRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(familyMembers).where(eq2(familyMembers.userId, ctx.user.id)).orderBy(asc(familyMembers.name));
  }),
  create: protectedProcedure.input(z2.object({
    name: z2.string().min(1),
    role: z2.enum(["parent", "child"]).optional(),
    color: z2.string().optional(),
    birthday: z2.string().optional(),
    notes: z2.string().optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(familyMembers).values({
      userId: ctx.user.id,
      name: input.name,
      role: input.role ?? "child",
      color: input.color ?? "#6366f1",
      birthday: input.birthday ? new Date(input.birthday) : void 0,
      notes: input.notes,
      imageUrl: input.imageUrl
    });
    return { success: true };
  }),
  update: protectedProcedure.input(z2.object({
    id: z2.number(),
    name: z2.string().optional(),
    role: z2.enum(["parent", "child"]).optional(),
    color: z2.string().optional(),
    birthday: z2.string().optional(),
    notes: z2.string().optional(),
    imageUrl: z2.string().optional(),
    points: z2.number().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    const { id, ...rest } = input;
    await db.update(familyMembers).set(rest).where(and(eq2(familyMembers.id, id), eq2(familyMembers.userId, ctx.user.id)));
    return { success: true };
  }),
  delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(familyMembers).where(and(eq2(familyMembers.id, input.id), eq2(familyMembers.userId, ctx.user.id)));
    return { success: true };
  }),
  uploadImage: protectedProcedure.input(z2.object({ memberId: z2.number(), fileData: z2.string(), fileName: z2.string(), mimeType: z2.string() })).mutation(async ({ ctx, input }) => {
    const buffer = Buffer.from(input.fileData, "base64");
    const key = `family-images/${ctx.user.id}/${input.memberId}-${Date.now()}-${input.fileName}`;
    const { url } = await storagePut(key, buffer, input.mimeType);
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(familyMembers).set({ imageUrl: url }).where(and(eq2(familyMembers.id, input.memberId), eq2(familyMembers.userId, ctx.user.id)));
    return { url };
  })
});
var photosRouter = router({
  albums: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(albums).where(eq2(albums.userId, ctx.user.id)).orderBy(desc(albums.createdAt));
  }),
  createAlbum: protectedProcedure.input(z2.object({ title: z2.string().min(1), description: z2.string().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(albums).values({ userId: ctx.user.id, title: input.title, description: input.description });
    return { success: true };
  }),
  deleteAlbum: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(albums).where(and(eq2(albums.id, input.id), eq2(albums.userId, ctx.user.id)));
    return { success: true };
  }),
  photos: protectedProcedure.input(z2.object({ albumId: z2.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions = [eq2(photos.userId, ctx.user.id)];
    if (input?.albumId) conditions.push(eq2(photos.albumId, input.albumId));
    return db.select().from(photos).where(and(...conditions)).orderBy(desc(photos.createdAt));
  }),
  uploadPhoto: protectedProcedure.input(z2.object({
    albumId: z2.number().optional(),
    fileData: z2.string(),
    fileName: z2.string(),
    mimeType: z2.string(),
    caption: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const buffer = Buffer.from(input.fileData, "base64");
    const key = `photos/${ctx.user.id}/${Date.now()}-${input.fileName}`;
    const { url } = await storagePut(key, buffer, input.mimeType);
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(photos).values({
      userId: ctx.user.id,
      albumId: input.albumId,
      url,
      fileKey: key,
      caption: input.caption
    });
    return { url };
  }),
  deletePhoto: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(photos).where(and(eq2(photos.id, input.id), eq2(photos.userId, ctx.user.id)));
    return { success: true };
  })
});
var documentsRouter = router({
  list: protectedProcedure.input(z2.object({ folder: z2.string().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions = [eq2(documents.userId, ctx.user.id)];
    if (input?.folder) conditions.push(eq2(documents.folder, input.folder));
    return db.select().from(documents).where(and(...conditions)).orderBy(desc(documents.createdAt));
  }),
  upload: protectedProcedure.input(z2.object({
    title: z2.string().min(1),
    description: z2.string().optional(),
    folder: z2.string().optional(),
    fileData: z2.string(),
    fileName: z2.string(),
    mimeType: z2.string(),
    size: z2.number().optional()
  })).mutation(async ({ ctx, input }) => {
    const buffer = Buffer.from(input.fileData, "base64");
    const key = `documents/${ctx.user.id}/${Date.now()}-${input.fileName}`;
    const { url } = await storagePut(key, buffer, input.mimeType);
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(documents).values({
      userId: ctx.user.id,
      title: input.title,
      description: input.description,
      folder: input.folder ?? "general",
      url,
      fileKey: key,
      mimeType: input.mimeType,
      size: input.size
    });
    return { url };
  }),
  delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(documents).where(and(eq2(documents.id, input.id), eq2(documents.userId, ctx.user.id)));
    return { success: true };
  })
});
var diaryRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(diaryEntries).where(eq2(diaryEntries.userId, ctx.user.id)).orderBy(desc(diaryEntries.entryDate));
  }),
  create: protectedProcedure.input(z2.object({
    title: z2.string().optional(),
    content: z2.string().min(1),
    mood: z2.enum(["happy", "neutral", "sad", "excited", "tired"]).optional(),
    entryDate: z2.string(),
    memberId: z2.number().optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(diaryEntries).values({
      userId: ctx.user.id,
      title: input.title,
      content: input.content,
      mood: input.mood ?? "neutral",
      entryDate: new Date(input.entryDate),
      memberId: input.memberId,
      imageUrl: input.imageUrl
    });
    return { success: true };
  }),
  update: protectedProcedure.input(z2.object({
    id: z2.number(),
    title: z2.string().optional(),
    content: z2.string().optional(),
    mood: z2.enum(["happy", "neutral", "sad", "excited", "tired"]).optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    const { id, ...rest } = input;
    await db.update(diaryEntries).set(rest).where(and(eq2(diaryEntries.id, id), eq2(diaryEntries.userId, ctx.user.id)));
    return { success: true };
  }),
  delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(diaryEntries).where(and(eq2(diaryEntries.id, input.id), eq2(diaryEntries.userId, ctx.user.id)));
    return { success: true };
  })
});
var goalsRouter = router({
  list: protectedProcedure.input(z2.object({ limit: z2.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(familyGoals).where(eq2(familyGoals.userId, ctx.user.id)).orderBy(desc(familyGoals.createdAt)).limit(input?.limit ?? 100);
  }),
  create: protectedProcedure.input(z2.object({
    title: z2.string().min(1),
    description: z2.string().optional(),
    category: z2.string().optional(),
    targetDate: z2.string().optional(),
    icon: z2.string().optional(),
    color: z2.string().optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(familyGoals).values({
      userId: ctx.user.id,
      title: input.title,
      description: input.description,
      category: input.category,
      targetDate: input.targetDate ? new Date(input.targetDate) : void 0,
      icon: input.icon,
      color: input.color ?? "#6366f1",
      imageUrl: input.imageUrl
    });
    return { success: true };
  }),
  update: protectedProcedure.input(z2.object({
    id: z2.number(),
    title: z2.string().optional(),
    progress: z2.number().min(0).max(100).optional(),
    completed: z2.boolean().optional(),
    description: z2.string().optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    const { id, ...rest } = input;
    await db.update(familyGoals).set(rest).where(and(eq2(familyGoals.id, id), eq2(familyGoals.userId, ctx.user.id)));
    return { success: true };
  }),
  delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(familyGoals).where(and(eq2(familyGoals.id, input.id), eq2(familyGoals.userId, ctx.user.id)));
    return { success: true };
  })
});
var rewardsRouter = router({
  list: protectedProcedure.input(z2.object({ memberId: z2.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions = [eq2(rewards.userId, ctx.user.id)];
    if (input?.memberId) conditions.push(eq2(rewards.memberId, input.memberId));
    return db.select().from(rewards).where(and(...conditions)).orderBy(asc(rewards.pointsCost));
  }),
  create: protectedProcedure.input(z2.object({
    memberId: z2.number(),
    title: z2.string().min(1),
    description: z2.string().optional(),
    pointsCost: z2.number().min(1),
    icon: z2.string().optional(),
    imageUrl: z2.string().optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(rewards).values({ userId: ctx.user.id, ...input });
    return { success: true };
  }),
  unlock: protectedProcedure.input(z2.object({ id: z2.number(), memberId: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    const [reward] = await db.select().from(rewards).where(and(eq2(rewards.id, input.id), eq2(rewards.userId, ctx.user.id)));
    if (!reward) throw new TRPCError3({ code: "NOT_FOUND" });
    const [member] = await db.select().from(familyMembers).where(and(eq2(familyMembers.id, input.memberId), eq2(familyMembers.userId, ctx.user.id)));
    if (!member) throw new TRPCError3({ code: "NOT_FOUND" });
    if ((member.points ?? 0) < reward.pointsCost) throw new TRPCError3({ code: "BAD_REQUEST", message: "Not enough points" });
    await db.update(familyMembers).set({ points: sql`${familyMembers.points} - ${reward.pointsCost}` }).where(eq2(familyMembers.id, input.memberId));
    await db.update(rewards).set({ unlocked: true, unlockedAt: /* @__PURE__ */ new Date() }).where(eq2(rewards.id, input.id));
    await db.insert(pointTransactions).values({
      userId: ctx.user.id,
      memberId: input.memberId,
      points: -reward.pointsCost,
      reason: `Reward unlocked: ${reward.title}`
    });
    return { success: true };
  }),
  addPoints: protectedProcedure.input(z2.object({ memberId: z2.number(), points: z2.number(), reason: z2.string().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(familyMembers).set({ points: sql`${familyMembers.points} + ${input.points}` }).where(and(eq2(familyMembers.id, input.memberId), eq2(familyMembers.userId, ctx.user.id)));
    await db.insert(pointTransactions).values({
      userId: ctx.user.id,
      memberId: input.memberId,
      points: input.points,
      reason: input.reason ?? "Points added"
    });
    return { success: true };
  }),
  pointHistory: protectedProcedure.input(z2.object({ memberId: z2.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(pointTransactions).where(and(eq2(pointTransactions.userId, ctx.user.id), eq2(pointTransactions.memberId, input.memberId))).orderBy(desc(pointTransactions.createdAt)).limit(50);
  }),
  delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(rewards).where(and(eq2(rewards.id, input.id), eq2(rewards.userId, ctx.user.id)));
    return { success: true };
  })
});
var aiRouter = router({
  history: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(chatMessages).where(eq2(chatMessages.userId, ctx.user.id)).orderBy(asc(chatMessages.createdAt)).limit(100);
  }),
  chat: protectedProcedure.input(z2.object({ message: z2.string().min(1), language: z2.enum(["sv", "so"]).optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(chatMessages).values({ userId: ctx.user.id, role: "user", content: input.message });
    const history = await db.select().from(chatMessages).where(eq2(chatMessages.userId, ctx.user.id)).orderBy(desc(chatMessages.createdAt)).limit(20);
    const systemPrompt = input.language === "so" ? "Adiga waxaad tahay caawiye qoys oo saaxiibtinimo leh. Waxaad caawisaa qoysaska qorshaha, karinta, miisaaniyada iyo hawlgalada. Ku jawaab Soomaali." : "Du \xE4r en v\xE4nlig och hj\xE4lpsam familjeassistent. Du hj\xE4lper familjer med planering, matlagning, budget och aktiviteter. Svara alltid p\xE5 svenska om inte anv\xE4ndaren skriver p\xE5 ett annat spr\xE5k.";
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.reverse().slice(-10).map((m) => ({ role: m.role, content: m.content }))
    ];
    const response = await invokeLLM({ messages });
    const rawContent = response.choices?.[0]?.message?.content;
    const assistantMessage = typeof rawContent === "string" ? rawContent : "Tyv\xE4rr kunde jag inte svara just nu.";
    await db.insert(chatMessages).values({ userId: ctx.user.id, role: "assistant", content: assistantMessage });
    return { message: assistantMessage };
  }),
  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(chatMessages).where(eq2(chatMessages.userId, ctx.user.id));
    return { success: true };
  })
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  calendar: calendarRouter,
  tasks: tasksRouter,
  reminders: remindersRouter,
  mealPlan: mealPlanRouter,
  shopping: shoppingRouter,
  budget: budgetRouter,
  family: familyRouter,
  photos: photosRouter,
  documents: documentsRouter,
  diary: diaryRouter,
  goals: goalsRouter,
  rewards: rewardsRouter,
  ai: aiRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "@tanstack/react-query"]
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
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
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
