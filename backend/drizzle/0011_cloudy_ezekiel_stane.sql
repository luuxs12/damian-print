CREATE TABLE "machine_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"machine_id" integer NOT NULL,
	"reading_date" timestamp DEFAULT now() NOT NULL,
	"counter_color" integer NOT NULL,
	"counter_bw" integer NOT NULL,
	"type" text DEFAULT 'START_SHIFT' NOT NULL,
	"registered_by_id" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "machines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"model" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"initial_counter_color" integer DEFAULT 0 NOT NULL,
	"initial_counter_bw" integer DEFAULT 0 NOT NULL,
	"current_counter_color" integer DEFAULT 0 NOT NULL,
	"current_counter_bw" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "print_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"machine_id" integer NOT NULL,
	"description" text NOT NULL,
	"print_type" text DEFAULT 'FRENTE' NOT NULL,
	"click_type" text DEFAULT 'COLOR' NOT NULL,
	"paper_size" text DEFAULT 'A3' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"calculated_clicks" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "machine_readings" ADD CONSTRAINT "machine_readings_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_readings" ADD CONSTRAINT "machine_readings_registered_by_id_users_id_fk" FOREIGN KEY ("registered_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "machine_readings_mach_date_idx" ON "machine_readings" USING btree ("machine_id","reading_date");--> statement-breakpoint
CREATE INDEX "machines_status_idx" ON "machines" USING btree ("status");--> statement-breakpoint
CREATE INDEX "print_jobs_machine_idx" ON "print_jobs" USING btree ("machine_id");