import { SetMetadata } from "@nestjs/common";

export const REQUEST_TIMEOUT_KEY = "requestTimeout";

export const RequestTimeout = (milliseconds: number) => SetMetadata(REQUEST_TIMEOUT_KEY, milliseconds);
