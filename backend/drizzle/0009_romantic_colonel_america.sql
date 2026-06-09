ALTER TABLE "products" ADD COLUMN "unit" text DEFAULT 'pieza' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "manage_inventory" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "count_as_print" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "send_to_production" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "branch_name" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sat_code" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sat_unit_code" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "price_public" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "price_reseller" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "price_scales" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "special_prices" jsonb DEFAULT '[]'::jsonb;