import { prisma } from "@/lib/generated/prisma";

export const GLOBAL_WAIVER_KEY = "GLOBAL" as const;

export const DEFAULT_WAIVER_CONTENT_HTML = `
<h1>Waiver and Release of Liability Form</h1>
<ol>
  <li>
    <strong>Assumption of Risk:</strong> I, [Member Name], understand that using the facility, equipment, and participating in classes at [Gym Name] involves inherent risks of injury, including but not limited to broken bones, muscle strains, heart attacks, or death. I voluntarily assume all risks, both known and unknown, associated with my participation, even if arising from the negligence of [Gym Name].
  </li>
  <li>
    <strong>Release of Liability:</strong> I hereby release, waive, discharge, and covenant not to sue [Gym Name], its owners, employees, or agents from any and all liability, claims, or demands for personal injury, property damage, or wrongful death occurring on the premises, including parking lots.
  </li>
  <li>
    <strong>Medical Treatment:</strong> I consent to receive first aid or medical treatment in the event of an accident or illness.
  </li>
  <li>
    <strong>Indemnification:</strong> I agree to indemnify and hold harmless [Gym Name] against any claims, damages, or expenses (including attorney fees) that may result from my participation.
  </li>
</ol>
<p><strong>I HAVE READ THIS RELEASE OF LIABILITY AND ASSUMPTION OF RISK AGREEMENT, FULLY UNDERSTAND ITS TERMS, AND SIGN IT VOLUNTARILY.</strong></p>
<p>Member Signature: _______________________ Date: ___________</p>
`.trim();

export interface WaiverSettingsRecord {
  id: string;
  contentHtml: string;
  version: number;
  isActive: boolean;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertWaiverSettingsInput {
  contentHtml: string;
  isActive?: boolean;
  updatedById?: string | null;
}

function normalizeHtml(value: string): string {
  return value.replaceAll(/\s+/g, " ").trim();
}

export function isMeaningfulWaiverHtml(value: string): boolean {
  const text = value
    .replaceAll(/<[^>]+>/g, " ")
    .replaceAll(/&nbsp;/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
  return text.length > 0;
}

export async function getWaiverSettings(): Promise<WaiverSettingsRecord> {
  const existing = await prisma.waiverSettings.findUnique({
    where: { key: GLOBAL_WAIVER_KEY },
  });
  if (existing) return existing;

  return prisma.waiverSettings.create({
    data: {
      key: GLOBAL_WAIVER_KEY,
      contentHtml: DEFAULT_WAIVER_CONTENT_HTML,
      version: 1,
      isActive: true,
    },
  });
}

export async function upsertWaiverSettings(input: UpsertWaiverSettingsInput): Promise<WaiverSettingsRecord> {
  const current = await getWaiverSettings();
  const normalizedCurrent = normalizeHtml(current.contentHtml);
  const normalizedIncoming = normalizeHtml(input.contentHtml);
  const isContentChanged = normalizedCurrent !== normalizedIncoming;

  return prisma.waiverSettings.update({
    where: { id: current.id },
    data: {
      contentHtml: input.contentHtml,
      isActive: input.isActive ?? current.isActive,
      updatedById: input.updatedById ?? null,
      version: isContentChanged ? current.version + 1 : current.version,
    },
  });
}

export function hasAcceptedCurrentWaiver({
  acceptedVersion,
  waiverVersion,
}: {
  acceptedVersion: number | null | undefined;
  waiverVersion: number;
}): boolean {
  if (!acceptedVersion) return false;
  return acceptedVersion >= waiverVersion;
}
