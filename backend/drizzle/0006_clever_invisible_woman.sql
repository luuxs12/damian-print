CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"username" text NOT NULL,
	"module" text NOT NULL,
	"action" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "presentations" DROP CONSTRAINT "presentations_name_unique";--> statement-breakpoint
ALTER TABLE "presentations" ADD COLUMN "product_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "presentations" ADD COLUMN "size" text;--> statement-breakpoint
ALTER TABLE "presentations" ADD COLUMN "material" text;--> statement-breakpoint
ALTER TABLE "presentations" ADD COLUMN "finish" text;--> statement-breakpoint
ALTER TABLE "presentations" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "presentations" ADD COLUMN "quantity" text;--> statement-breakpoint
ALTER TABLE "presentations" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "presentations" ADD COLUMN "cost" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "presentations" ADD COLUMN "price" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "presentations" ADD COLUMN "wholesale_price" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentations" ADD CONSTRAINT "presentations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;