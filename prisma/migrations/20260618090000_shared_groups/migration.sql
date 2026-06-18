-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "inviteCode" TEXT;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Group_inviteCode_key" ON "Group"("inviteCode");

-- CreateIndex
CREATE INDEX "Member_userId_idx" ON "Member"("userId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: link each group creator's existing "me" member to their account
-- so current users keep access once access is gated by membership.
UPDATE "Member" m
SET "userId" = g."userId"
FROM "Group" g
WHERE m."groupId" = g.id AND m."isMe" = true;
