CREATE TABLE "sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_number" text NOT NULL,
	"quotation_id" integer,
	"client_id" integer,
	"client_name" text NOT NULL,
	"client_document" text NOT NULL,
	"client_phone" text,
	"client_email" text,
	"client_address" text,
	"subtotal" double precision DEFAULT 0 NOT NULL,
	"discount" double precision DEFAULT 0 NOT NULL,
	"tax" double precision DEFAULT 0 NOT NULL,
	"total" double precision DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'PENDIENTE' NOT NULL,
	"payment_method" text DEFAULT 'EFECTIVO' NOT NULL,
	"billing_type" text DEFAULT 'NOTA_DE_VENTA' NOT NULL,
	"billing_number" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_id" integer,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" double precision DEFAULT 0 NOT NULL,
	"total_price" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_sale_number_unique" UNIQUE("sale_number");
--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;
