import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 12;

@Injectable()
export class HashService {
  hash(value: string) {
    return bcrypt.hash(value, BCRYPT_ROUNDS);
  }

  compare(value: string, hash: string) {
    return bcrypt.compare(value, hash);
  }
}
