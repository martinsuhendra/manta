/**
 * Payroll fee for one completed session when fee model is per-participant.
 * Optional guarantee: if billable pax is between 1 and guaranteeMaxPax (inclusive), pay minGuarantee IDR
 * instead of (ratePerPerson × pax). If pax is 0, fee is 0.
 */
export function perParticipantSessionFeeIdr(params: {
  ratePerPerson: number;
  billablePax: number;
  minGuarantee: number | null | undefined;
  guaranteeMaxPax: number | null | undefined;
}): number {
  const { ratePerPerson, billablePax, minGuarantee, guaranteeMaxPax } = params;
  if (billablePax <= 0) return 0;

  const hasGuarantee = minGuarantee != null && guaranteeMaxPax != null && guaranteeMaxPax >= 1 && minGuarantee >= 0;

  if (hasGuarantee && billablePax <= guaranteeMaxPax) return minGuarantee;
  return ratePerPerson * billablePax;
}
