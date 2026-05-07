import { Injectable } from "@nestjs/common";

@Injectable()
export class HealthService {
  async getStatus() {
    return {
      name: "social-media-api",
      status: "ok",
    };
  }
}
