/*
  Warnings:

  - You are about to drop the column `created_at` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `customer_name` on the `orders` table. All the data in the column will be lost.
  - The primary key for the `system_settings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `cafes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[key]` on the table `system_settings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `cafes` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `system_settings` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_table_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_order_id_fkey";

-- AlterTable
ALTER TABLE "cafe_admins" ADD COLUMN     "is_two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reset_code" TEXT,
ADD COLUMN     "reset_code_expires" TIMESTAMP(3),
ADD COLUMN     "two_factor_secret" TEXT;

-- AlterTable
ALTER TABLE "cafes" ADD COLUMN     "authorized_person" TEXT,
ADD COLUMN     "auto_approve_reviews" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "brand_color" TEXT DEFAULT '#000000',
ADD COLUMN     "city" TEXT,
ADD COLUMN     "cover_image_url" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "facebook_url" TEXT,
ADD COLUMN     "google_maps_url" TEXT,
ADD COLUMN     "instagram_url" TEXT,
ADD COLUMN     "is_maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "menu_view_mode" TEXT DEFAULT 'card',
ADD COLUMN     "payment_methods" TEXT,
ADD COLUMN     "preparation_time" INTEGER,
ADD COLUMN     "service_type" TEXT,
ADD COLUMN     "show_product_ratings" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "template_id" TEXT DEFAULT 'classic',
ADD COLUMN     "theme_config" TEXT,
ADD COLUMN     "twitter_url" TEXT,
ADD COLUMN     "type" TEXT,
ADD COLUMN     "waiter_call_options" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "welcome_message" TEXT,
ADD COLUMN     "wifi_password" TEXT,
ADD COLUMN     "wifi_ssid" TEXT,
ADD COLUMN     "working_hours" TEXT;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "created_at",
ADD COLUMN     "note" TEXT,
ADD COLUMN     "options" TEXT;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "customer_name",
ADD COLUMN     "customer_id" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "payment_method" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "total_amount" DROP DEFAULT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "average_rating" DECIMAL(3,2) DEFAULT 0,
ADD COLUMN     "is_chef_recommended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "original_price" DECIMAL(10,2),
ADD COLUMN     "preparation_time" INTEGER,
ADD COLUMN     "requires_preparation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "review_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "stock" DROP NOT NULL,
ALTER COLUMN "stock" SET DEFAULT 9999;

-- AlterTable
ALTER TABLE "system_settings" DROP CONSTRAINT "system_settings_pkey",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "tables" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "last_occupied_at" TIMESTAMP(3),
ADD COLUMN     "qr_code" TEXT;

-- DropTable
DROP TABLE "payments";

-- CreateTable
CREATE TABLE "waiter_calls" (
    "id" TEXT NOT NULL,
    "cafe_id" TEXT NOT NULL,
    "table_id" TEXT NOT NULL,
    "type" TEXT DEFAULT 'Garson',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waiter_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device" TEXT,
    "ip" TEXT,
    "last_active" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "password_hash" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_code" TEXT,
    "verification_code_expires" TIMESTAMP(3),
    "reset_code" TEXT,
    "reset_code_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "cafe_id" TEXT NOT NULL,
    "product_id" TEXT,
    "customer_id" TEXT,
    "order_id" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "customer_name" TEXT,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "admin_reply" TEXT,
    "admin_score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_key" ON "admin_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cafes_slug_key" ON "cafes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- AddForeignKey
ALTER TABLE "waiter_calls" ADD CONSTRAINT "waiter_calls_cafe_id_fkey" FOREIGN KEY ("cafe_id") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiter_calls" ADD CONSTRAINT "waiter_calls_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "cafe_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
