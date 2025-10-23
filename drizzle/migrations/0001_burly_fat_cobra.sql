ALTER TABLE "userSettings" ADD COLUMN "telegramChatId" varchar(255);--> statement-breakpoint
ALTER TABLE "userSettings" ADD COLUMN "telegramAlertsEnabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "userSettings" ADD COLUMN "telegramLiquidationAlerts" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "userSettings" ADD COLUMN "telegramFillAlerts" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "userSettings" ADD COLUMN "telegramPriceAlerts" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "userSettings" ADD COLUMN "telegramPnLAlerts" boolean DEFAULT true;