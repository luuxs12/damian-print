CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text DEFAULT 'PARTICULAR' NOT NULL,
	"name" text NOT NULL,
	"document_type" text DEFAULT 'DNI' NOT NULL,
	"document" text NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"city" text,
	"contact_name" text,
	"notes" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "clients_document_unique" UNIQUE("document")
);
--> statement-breakpoint
CREATE TABLE "presentation_supplies" (
	"id" serial PRIMARY KEY NOT NULL,
	"presentation_id" integer NOT NULL,
	"supply_id" integer NOT NULL,
	"quantity" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplies" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"stock" double precision DEFAULT 0 NOT NULL,
	"min_stock" double precision DEFAULT 0 NOT NULL,
	"unit" text NOT NULL,
	"cost" double precision DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "supplies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "presentation_supplies" ADD CONSTRAINT "presentation_supplies_presentation_id_presentations_id_fk" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_supplies" ADD CONSTRAINT "presentation_supplies_supply_id_supplies_id_fk" FOREIGN KEY ("supply_id") REFERENCES "public"."supplies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clients_name_idx" ON "clients" USING btree ("name");--> statement-breakpoint
CREATE INDEX "clients_document_idx" ON "clients" USING btree ("document");--> statement-breakpoint
CREATE INDEX "clients_status_idx" ON "clients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "clients_type_idx" ON "clients" USING btree ("type");--> statement-breakpoint
CREATE INDEX "presentation_supplies_presentation_id_idx" ON "presentation_supplies" USING btree ("presentation_id");--> statement-breakpoint
CREATE INDEX "presentation_supplies_supply_id_idx" ON "presentation_supplies" USING btree ("supply_id");