import { Controller, Get } from "@nestjs/common";

import { HealthService } from "./health.service";

import { PublicRoute } from "#modules/auth/decorators/auth-route-type.decorator";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @PublicRoute()
  @Get()
  getHealth() {
    return this.healthService.getStatus();
  }
}
