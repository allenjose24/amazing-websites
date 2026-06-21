// src/lib/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function isValidPreviewUrl(url) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const extRegex = /\.(webp|webm|png|jpe?g|gif|svg|mp4)$/i;
    return extRegex.test(parsed.pathname);
  } catch {
    return false;
  }
}