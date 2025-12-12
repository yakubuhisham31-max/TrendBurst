import { differenceInDays } from "date-fns";

export type TrendStatus = "active" | "ending-soon" | "ended";

export function getTrendStatus(endDate: Date | undefined | null): TrendStatus | null {
  if (!endDate) return null;
  
  const now = new Date();
  const endTime = new Date(endDate);
  const daysUntilEnd = differenceInDays(endTime, now);
  
  if (endTime < now) return "ended";
  if (daysUntilEnd <= 3) return "ending-soon";
  return "active";
}

export function getDaysLeft(endDate: Date | undefined | null): number | null {
  if (!endDate) return null;
  
  const now = new Date();
  const endTime = new Date(endDate);
  return differenceInDays(endTime, now);
}
