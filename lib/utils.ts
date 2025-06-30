import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// time to float
export function timeToFloat(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return hours + minutes / 60;
}
