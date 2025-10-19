CREATE TABLE `trades` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`coin` varchar(32) NOT NULL,
	`side` enum('buy','sell') NOT NULL,
	`size` varchar(32) NOT NULL,
	`price` varchar(32) NOT NULL,
	`orderType` varchar(32) NOT NULL,
	`status` varchar(32) NOT NULL,
	`oid` varchar(64),
	`filledSize` varchar(32),
	`avgFillPrice` varchar(32),
	`fee` varchar(32),
	`pnl` varchar(32),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSettings` (
	`userId` varchar(64) NOT NULL,
	`defaultLeverage` varchar(8) DEFAULT '1',
	`defaultSlippage` varchar(8) DEFAULT '0.05',
	`favoriteCoins` text,
	`theme` varchar(16) DEFAULT 'dark',
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `userSettings_userId` PRIMARY KEY(`userId`)
);
