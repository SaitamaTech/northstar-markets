CREATE TABLE `wallets` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` varchar(64) NOT NULL,
  `cashBalance` decimal(20,8) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `wallets_id` PRIMARY KEY(`id`),
  CONSTRAINT `wallets_userId_unique` UNIQUE(`userId`)
);
CREATE TABLE `assets` (
  `id` int AUTO_INCREMENT NOT NULL,
  `symbol` varchar(16) NOT NULL,
  `name` varchar(100) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `assets_id` PRIMARY KEY(`id`),
  CONSTRAINT `assets_symbol_unique` UNIQUE(`symbol`)
);
CREATE TABLE `investment_positions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` varchar(64) NOT NULL,
  `assetId` int NOT NULL,
  `quantity` decimal(28,12) NOT NULL DEFAULT 0,
  `averageEntryPrice` decimal(20,8) NOT NULL DEFAULT 0,
  `investedAmount` decimal(20,8) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `investment_positions_id` PRIMARY KEY(`id`)
);
CREATE TABLE `transactions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` varchar(64) NOT NULL,
  `type` enum('deposit','withdrawal','buy','sell','transfer','fee') NOT NULL,
  `assetId` int,
  `amount` decimal(20,8) NOT NULL,
  `quantity` decimal(28,12),
  `price` decimal(20,8),
  `fee` decimal(20,8) NOT NULL DEFAULT 0,
  `currency` varchar(16) NOT NULL DEFAULT 'USD',
  `status` enum('pending','processing','completed','failed','cancelled','rejected') NOT NULL DEFAULT 'pending',
  `transactionId` varchar(100) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
  CONSTRAINT `transactions_transactionId_unique` UNIQUE(`transactionId`)
);