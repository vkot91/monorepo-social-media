import { Injectable } from "@nestjs/common";
import { compare, hash } from "bcrypt";

const BCRYPT_ROUNDS = 12;

@Injectable()
export class HashService {
  hash(value: string) {
    return hash(value, BCRYPT_ROUNDS);
  }

  compare(value: string, hashedValue: string) {
    return compare(value, hashedValue);
  }
}
