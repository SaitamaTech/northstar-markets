CREATE TABLE `investment_plans` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(64) NOT NULL,
  `asset` varchar(16) NOT NULL,
  `minimumInvestment` decimal(20,8) NOT NULL,
  `durationDays` int NOT NULL,
  `dailyRate` decimal(12,8) NOT NULL,
  `isActive` int NOT NULL DEFAULT 1,
  `description` text,
  `riskNote` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `investment_plans_id` PRIMARY KEY(`id`)
);

CREATE TABLE `investments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` varchar(64) NOT NULL,
  `asset` varchar(16) NOT NULL,
  `principalAmount` decimal(20,8) NOT NULL,
  `planId` int NOT NULL,
  `interestRate` decimal(12,8) NOT NULL,
  `interestFrequency` varchar(16) NOT NULL DEFAULT 'daily',
  `dailyInterestAmount` decimal(20,8) NOT NULL DEFAULT 0,
  `accruedInterest` decimal(20,8) NOT NULL DEFAULT 0,
  `totalValue` decimal(20,8) NOT NULL DEFAULT 0,
  `startDate` timestamp NOT NULL DEFAULT (now()),
  `maturityDate` timestamp NULL,
  `lastAccrualDate` timestamp NULL,
  `nextAccrualDate` timestamp NULL,
  `status` enum('ACTIVE','MATURED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `investments_id` PRIMARY KEY(`id`),
  KEY `investments_user_status_idx` (`userId`,`status`)
);

CREATE TABLE `investment_accruals` (
  `id` int AUTO_INCREMENT NOT NULL,
  `investmentId` int NOT NULL,
  `userId` varchar(64) NOT NULL,
  `asset` varchar(16) NOT NULL,
  `transactionType` enum('INVESTMENT_CREATED','DAILY_INTEREST','INVESTMENT_MATURED','INVESTMENT_COMPLETED','INVESTMENT_CANCELLED','INVESTMENT_WITHDRAWAL') NOT NULL,
  `amount` decimal(20,8) NOT NULL,
  `balanceAfter` decimal(20,8) NOT NULL,
  `accrualDate` timestamp NOT NULL DEFAULT (now()),
  `description` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `investment_accruals_id` PRIMARY KEY(`id`),
  KEY `investment_accruals_investment_date_idx` (`investmentId`,`accrualDate`),
  UNIQUE KEY `investment_accruals_investment_day_unique` (`investmentId`,`accrualDate`)
);
