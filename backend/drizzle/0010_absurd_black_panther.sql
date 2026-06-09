ALTER TABLE "products" ALTER COLUMN "unit" SET DEFAULT 'Pieza';--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "price_scales" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "special_prices" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "type" text DEFAULT 'FINISHED_PRODUCT' NOT NULL;