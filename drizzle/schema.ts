import { bigint, decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull().unique(),
  cashBalance: decimal("cashBalance", { precision: 20, scale: 8 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 16 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const investmentPositions = mysqlTable("investment_positions", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  assetId: int("assetId").notNull(),
  quantity: decimal("quantity", { precision: 28, scale: 12 }).default("0").notNull(),
  averageEntryPrice: decimal("averageEntryPrice", { precision: 20, scale: 8 }).default("0").notNull(),
  investedAmount: decimal("investedAmount", { precision: 20, scale: 8 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  type: mysqlEnum("type", ["deposit", "withdrawal", "buy", "sell", "transfer", "fee"]).notNull(),
  assetId: int("assetId"),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  quantity: decimal("quantity", { precision: 28, scale: 12 }),
  price: decimal("price", { precision: 20, scale: 8 }),
  fee: decimal("fee", { precision: 20, scale: 8 }).default("0").notNull(),
  currency: varchar("currency", { length: 16 }).default("USD").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "cancelled", "rejected"]).default("pending").notNull(),
  transactionId: varchar("transactionId", { length: 100 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const btcDepositAddresses = mysqlTable("btc_deposit_addresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  address: varchar("address", { length: 100 }).notNull().unique(),
  network: mysqlEnum("network", ["testnet", "mainnet"]).notNull(),
  label: varchar("label", { length: 100 }),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const btcDeposits = mysqlTable("btc_deposits", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  depositAddressId: int("depositAddressId").notNull(),
  depositAddress: varchar("depositAddress", { length: 100 }).notNull(),
  transactionHash: varchar("transactionHash", { length: 128 }).notNull().unique(),
  amountSatoshis: bigint("amountSatoshis", { mode: "number" }).notNull(),
  btcPriceAtDeposit: decimal("btcPriceAtDeposit", { precision: 20, scale: 8 }),
  usdValueAtDeposit: decimal("usdValueAtDeposit", { precision: 20, scale: 8 }),
  confirmations: int("confirmations").default(0).notNull(),
  requiredConfirmations: int("requiredConfirmations").notNull(),
  status: mysqlEnum("status", ["pending", "detected", "confirming", "confirmed", "failed", "reversed"]).default("pending").notNull(),
  detectedAt: timestamp("detectedAt"),
  confirmedAt: timestamp("confirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ userStatusIndex: index("btc_deposits_user_status_idx").on(table.userId, table.status) }));

export const walletBalances = mysqlTable("wallet_balances", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull().unique(),
  btcBalanceSatoshis: bigint("btcBalanceSatoshis", { mode: "number" }).default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const ledgerTransactions = mysqlTable("ledger_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  type: mysqlEnum("type", ["deposit", "withdrawal", "investment", "investment_return", "fee", "adjustment"]).notNull(),
  asset: varchar("asset", { length: 16 }).notNull(),
  amountSatoshis: bigint("amountSatoshis", { mode: "number" }).notNull(),
  referenceId: varchar("referenceId", { length: 100 }).notNull().unique(),
  transactionHash: varchar("transactionHash", { length: 128 }),
  status: mysqlEnum("status", ["pending", "completed", "reversed"]).default("completed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ userAssetIndex: index("ledger_user_asset_idx").on(table.userId, table.asset) }));