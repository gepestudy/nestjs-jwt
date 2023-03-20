-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'OPS', 'MANAGER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
