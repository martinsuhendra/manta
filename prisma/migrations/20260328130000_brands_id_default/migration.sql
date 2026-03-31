-- brands.id was created without a DB default; Prisma omits id on create expecting gen_random_uuid().
ALTER TABLE "public"."brands" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
