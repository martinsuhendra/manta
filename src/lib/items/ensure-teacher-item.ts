import type { Prisma } from "@prisma/client";

import { USER_ROLES } from "@/lib/types";

export async function ensureTeacherItems({
  tx,
  itemId,
  teacherIds,
}: {
  tx: Prisma.TransactionClient;
  itemId: string;
  teacherIds: Array<string | null | undefined>;
}) {
  const uniqueTeacherIds = [...new Set(teacherIds.filter((teacherId): teacherId is string => Boolean(teacherId)))];
  if (uniqueTeacherIds.length === 0) return;

  const teachers = await tx.user.findMany({
    where: { id: { in: uniqueTeacherIds }, role: USER_ROLES.TEACHER },
    select: { id: true },
  });
  if (teachers.length === 0) return;

  await tx.teacherItem.createMany({
    data: teachers.map((teacher) => ({
      teacherId: teacher.id,
      itemId,
    })),
    skipDuplicates: true,
  });
}
