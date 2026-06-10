import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";

import { PublicRoute } from "#modules/auth/decorators/auth-route-type.decorator";

import { HealthService } from "./health.service";

@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @PublicRoute()
  @Get()
  getHealth() {
    return this.healthService.getStatus();
  }
}
