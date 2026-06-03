// PROJECT STRUCTURE
/*
agricane-backend/
├── src/
│   ├── auth/
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── jwt-refresh.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-refresh.strategy.ts
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   └── refresh-token.dto.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── fields/
│   │   ├── dto/
│   │   │   ├── create-field.dto.ts
│   │   │   └── update-field.dto.ts
│   │   ├── fields.controller.ts
│   │   ├── fields.service.ts
│   │   └── fields.module.ts
│   ├── environmental/
│   │   ├── dto/
│   │   │   └── weather-data.dto.ts
│   │   ├── environmental.controller.ts
│   │   ├── environmental.service.ts
│   │   ├── environmental.cron.ts
│   │   └── environmental.module.ts
│   ├── agronomy/
│   │   ├── dto/
│   │   │   └── fao-reference.dto.ts
│   │   ├── agronomy.controller.ts
│   │   ├── agronomy.service.ts
│   │   └── agronomy.module.ts
│   ├── iot/
│   │   ├── dto/
│   │   │   ├── create-sensor-reading.dto.ts
│   │   │   └── sensor-reading.dto.ts
│   │   ├── iot.controller.ts
│   │   ├── iot.service.ts
│   │   ├── iot.gateway.ts
│   │   └── iot.module.ts
│   ├── monitoring/
│   │   ├── dto/
│   │   │   ├── create-drone-flight.dto.ts
│   │   │   ├── ndvi-data.dto.ts
│   │   │   └── field-health.dto.ts
│   │   ├── monitoring.controller.ts
│   │   ├── monitoring.service.ts
│   │   └── monitoring.module.ts
│   ├── ai-decision/
│   │   ├── dto/
│   │   │   ├── decision-request.dto.ts
│   │   │   └── decision-response.dto.ts
│   │   ├── ai-decision.controller.ts
│   │   ├── ai-decision.service.ts
│   │   └── ai-decision.module.ts
│   ├── notifications/
│   │   ├── dto/
│   │   │   └── create-notification.dto.ts
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   └── notifications.module.ts
│   ├── common/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   └── enums/
│   │       ├── role.enum.ts
│   │       ├── growth-status.enum.ts
│   │       └── health-status.enum.ts
│   ├── config/
│   │   └── configuration.ts
│   ├── prisma/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── .env.example
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── nest-cli.json
└── README.md
*/