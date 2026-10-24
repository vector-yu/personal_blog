import { en } from './en';
import type { Messages } from './zh';
import { zh } from './zh';
import type { Locale } from '../config';

export { en, zh };
export type { Messages };

export const messages: Record<Locale, Messages> = { zh, en };
