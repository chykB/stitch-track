import {
  createPinoApplicationLogger,
} from "../infrastructure/logging/pino-logger";

export const applicationLogger =
  createPinoApplicationLogger();
