CREATE TABLE `btc_deposit_addresses` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` varchar(64) NOT NULL,
  `address` varchar(100) NOT NULL,
  `network` enum('testnet','mainnet') NOT NULL,
  `label` varchar(100),
  `isActive` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `btc_deposit_addresses_id` PRIMARY KEY(`id`),
  CONSTRAINT `btc_deposit_addresses_address_unique` UNIQUE(`address`)
);
CREATE TABLE `btc_deposits` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` varchar(64) NOT NULL,
  `depositAddressId` int NOT NULL,
  `depositAddress` varchar(100) NOT NULL,
  `transactionHash` varchar(128) NOT NULL,
  `amountSatoshis` bigint NOT NULL,
  `btcPriceAtDeposit` decimal(20,8),
  `usdValueAtDeposit` decimal(20,8),
  `confirmations` int NOT NULL DEFAULT 0,
  `requiredConfirmations` int NOT NULL,
  `status` enum('pending','detected','confirming','confirmed','failed','reversed') NOT NULL DEFAULT 'pending',
  `detectedAt` timestamp,
  `confirmedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `btc_deposits_id` PRIMARY KEY(`id`),
  CONSTRAINT `btc_deposits_transactionHash_unique` UNIQUE(`transactionHash`),
  INDEX `btc_deposits_user_status_idx` (`userId`,`status`)
);
CREATE TABLE `wallet_balances` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` varchar(64) NOT NULL,
  `btcBalanceSatoshis` bigint NOT NULL DEFAULT 0,
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `wallet_balances_id` PRIMARY KEY(`id`),
  CONSTRAINT `wallet_balances_userId_unique` UNIQUE(`userId`)
);
CREATE TABLE `ledger_transactions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` varchar(64) NOT NULL,
  `type` enum('deposit','withdrawal','investment','investment_return','fee','adjustment') NOT NULL,
  `asset` varchar(16) NOT NULL,
  `amountSatoshis` bigint NOT NULL,
  `referenceId` varchar(100) NOT NULL,
  `transactionHash` varchar(128),
  `status` enum('pending','completed','reversed') NOT NULL DEFAULT 'completed',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `ledger_transactions_id` PRIMARY KEY(`id`),
  CONSTRAINT `ledger_transactions_referenceId_unique` UNIQUE(`referenceId`),
  INDEX `ledger_user_asset_idx` (`userId`,`asset`)
);