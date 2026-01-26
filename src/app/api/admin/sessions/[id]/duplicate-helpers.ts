import { prisma } from "@/lib/generated/prisma";

interface CheckDuplicateParams {
  sessionId: string;
  itemId: string;
  date: Date;
  startTime: string;
}

export async function checkForDuplicateSession({
  sessionId,
  itemId,
  date,
  startTime,
}: CheckDuplicateParams): Promise<{ isDuplicate: boolean; duplicateId?: string }> {
  const duplicate = await prisma.classSession.findUnique({
    where: {
      itemId_date_startTime: {
        itemId,
        date,
        startTime,
      },
    },
    select: {
      id: true,
    },
  });

  if (duplicate && duplicate.id !== sessionId) {
    return { isDuplicate: true, duplicateId: duplicate.id };
  }

  return { isDuplicate: false };
}
