import { Injectable } from "@nestjs/common";
import { prisma, User } from "@social/database";

export type HealthStatus = {
  name: string;
  status: "ok";
  users: User[];
};

@Injectable()
export class HealthService {
  async getStatus(): Promise<HealthStatus> {
    const users = await prisma.user.findMany();

    return {
      name: "social-media-api",
      status: "ok",
      users,
    };
  }
}
