DROP TABLE IF EXISTS "machine_readings" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "print_jobs" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "machines" CASCADE;
--> statement-breakpoint
CREATE TABLE "production_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"product_id" integer,
	"product_name" text NOT NULL,
	"client_name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"branch_name" text DEFAULT 'Taller Principal' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"promised_date" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_order_number_unique" UNIQUE("order_number");
--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;