-- AlterTable
ALTER TABLE "cafe_admins" ADD COLUMN     "is_approved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "cafes" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';
