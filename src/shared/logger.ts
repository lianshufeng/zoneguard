const PREFIX = "[ZoneGuard]";

export const logger = {
  info(message: string, ...details: unknown[]): void {
    console.info(PREFIX, message, ...details);
  },
  warn(message: string, ...details: unknown[]): void {
    console.warn(PREFIX, message, ...details);
  },
  error(message: string, ...details: unknown[]): void {
    console.error(PREFIX, message, ...details);
  },
};
