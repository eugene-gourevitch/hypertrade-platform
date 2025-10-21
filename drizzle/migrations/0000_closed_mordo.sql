CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."side" AS ENUM('buy', 'sell');--> statement-breakpoint
CREATE TABLE "aiRecommendations" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(64) NOT NULL,
	"selectedCoin" varchar(20),
	"accountValue" varchar(50),
	"totalPositions" integer,
	"accountLeverage" numeric(10, 2),
	"analysis" text NOT NULL,
	"tokensUsed" integer,
	"model" varchar(50),
	"responseTime" integer,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apiLogs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(64),
	"endpoint" varchar(255) NOT NULL,
	"method" varchar(10) NOT NULL,
	"statusCode" integer NOT NULL,
	"responseTime" integer,
	"ipAddress" varchar(45),
	"userAgent" text,
	"errorMessage" text,
	"requestBody" text,
	"responseBody" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "errorLogs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(64),
	"errorType" varchar(100) NOT NULL,
	"errorMessage" text NOT NULL,
	"stackTrace" text,
	"context" text,
	"severity" varchar(20) NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolvedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liquidationAlerts" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(64) NOT NULL,
	"coin" varchar(20) NOT NULL,
	"positionSize" varchar(50) NOT NULL,
	"currentPrice" varchar(50) NOT NULL,
	"liquidationPrice" varchar(50) NOT NULL,
	"distancePercent" numeric(10, 4) NOT NULL,
	"alertType" varchar(20) NOT NULL,
	"emailSent" boolean DEFAULT false NOT NULL,
	"emailError" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performanceMetrics" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(64) NOT NULL,
	"date" timestamp NOT NULL,
	"totalTrades" integer DEFAULT 0 NOT NULL,
	"profitableTrades" integer DEFAULT 0 NOT NULL,
	"totalPnl" varchar(50) DEFAULT '0' NOT NULL,
	"totalVolume" varchar(50) DEFAULT '0' NOT NULL,
	"totalFees" varchar(50) DEFAULT '0' NOT NULL,
	"averageHoldTime" integer,
	"largestWin" varchar(50),
	"largestLoss" varchar(50),
	"winRate" numeric(5, 2),
	"sharpeRatio" numeric(10, 4),
	"maxDrawdown" varchar(50),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"userId" varchar(64) NOT NULL,
	"coin" varchar(32) NOT NULL,
	"side" "side" NOT NULL,
	"size" varchar(32) NOT NULL,
	"price" varchar(32) NOT NULL,
	"orderType" varchar(32) NOT NULL,
	"status" varchar(32) NOT NULL,
	"oid" varchar(64),
	"filledSize" varchar(32),
	"avgFillPrice" varchar(32),
	"fee" varchar(32),
	"pnl" varchar(32),
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tradingLogs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(64) NOT NULL,
	"action" varchar(50) NOT NULL,
	"coin" varchar(20) NOT NULL,
	"orderType" varchar(20),
	"side" varchar(10),
	"size" varchar(50),
	"price" varchar(50),
	"leverage" integer,
	"success" boolean NOT NULL,
	"errorMessage" text,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userSessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(64) NOT NULL,
	"sessionStart" timestamp DEFAULT now() NOT NULL,
	"sessionEnd" timestamp,
	"ipAddress" varchar(45),
	"userAgent" text,
	"deviceType" varchar(50),
	"country" varchar(2),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userSettings" (
	"userId" varchar(64) PRIMARY KEY NOT NULL,
	"defaultLeverage" varchar(8) DEFAULT '1',
	"defaultSlippage" varchar(8) DEFAULT '0.05',
	"favoriteCoins" text,
	"theme" varchar(16) DEFAULT 'dark',
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64) DEFAULT 'wallet',
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"lastSignedIn" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "aiRecommendations_userId_idx" ON "aiRecommendations" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "aiRecommendations_createdAt_idx" ON "aiRecommendations" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "apiLogs_userId_idx" ON "apiLogs" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "apiLogs_endpoint_idx" ON "apiLogs" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "apiLogs_createdAt_idx" ON "apiLogs" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "errorLogs_errorType_idx" ON "errorLogs" USING btree ("errorType");--> statement-breakpoint
CREATE INDEX "errorLogs_severity_idx" ON "errorLogs" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "errorLogs_resolved_idx" ON "errorLogs" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "errorLogs_createdAt_idx" ON "errorLogs" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "liquidationAlerts_userId_idx" ON "liquidationAlerts" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "liquidationAlerts_alertType_idx" ON "liquidationAlerts" USING btree ("alertType");--> statement-breakpoint
CREATE INDEX "liquidationAlerts_createdAt_idx" ON "liquidationAlerts" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "performanceMetrics_userId_idx" ON "performanceMetrics" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "performanceMetrics_date_idx" ON "performanceMetrics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "tradingLogs_userId_idx" ON "tradingLogs" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "tradingLogs_action_idx" ON "tradingLogs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "tradingLogs_coin_idx" ON "tradingLogs" USING btree ("coin");--> statement-breakpoint
CREATE INDEX "tradingLogs_createdAt_idx" ON "tradingLogs" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "userSessions_userId_idx" ON "userSessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "userSessions_sessionStart_idx" ON "userSessions" USING btree ("sessionStart");