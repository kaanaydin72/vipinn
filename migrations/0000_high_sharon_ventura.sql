CREATE TABLE "hotel_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"cancellation_policy" text NOT NULL,
	"cancellation_days" integer DEFAULT 1 NOT NULL,
	"check_in_time" text NOT NULL,
	"check_out_time" text NOT NULL,
	"children_policy" text NOT NULL,
	"pet_policy" text NOT NULL,
	"extra_bed_policy" text,
	"extra_bed_price" integer,
	"deposit_required" boolean DEFAULT false,
	"deposit_amount" integer,
	"other_rules" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"city" text,
	"district" text,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"stars" integer NOT NULL,
	"address" text NOT NULL,
	"phone" text,
	"amenities" text[] NOT NULL,
	"rating" double precision
);
--> statement-breakpoint
CREATE TABLE "page_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_key" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "page_contents_page_key_unique" UNIQUE("page_key")
);
--> statement-breakpoint
CREATE TABLE "paytr_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"merchant_key" text NOT NULL,
	"merchant_salt" text NOT NULL,
	"test_mode" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paytr_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"reservation_id" integer NOT NULL,
	"merchant_oid" text NOT NULL,
	"amount" integer NOT NULL,
	"token" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"request_data" text,
	"response_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"room_id" integer NOT NULL,
	"check_in" timestamp NOT NULL,
	"check_out" timestamp NOT NULL,
	"number_of_guests" integer NOT NULL,
	"total_price" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text DEFAULT 'on_site' NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"payment_id" text,
	"reservation_code" text
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"capacity" integer NOT NULL,
	"room_count" integer DEFAULT 1 NOT NULL,
	"image_url" text NOT NULL,
	"images" text,
	"features" text[] NOT NULL,
	"type" text NOT NULL,
	"daily_prices" text,
	"weekday_prices" text
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"theme" text DEFAULT 'classic' NOT NULL,
	CONSTRAINT "themes_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "hotel_policies" ADD CONSTRAINT "hotel_policies_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;