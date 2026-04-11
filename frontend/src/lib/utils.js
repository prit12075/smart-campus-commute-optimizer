import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes with conditional helpers
export const cn = (...inputs) => twMerge(clsx(inputs));
