import z from "zod";

export type SchemaShape<T> = {
  [K in keyof T]-?: z.ZodType<T[K]>;
};
