-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'AGRONOMIST', 'DRONE_OPERATOR', 'TECHNICIAN', 'MANAGER');

-- CreateEnum
CREATE TYPE "GrowthStatus" AS ENUM ('PLANTED', 'GROWING', 'HARVEST_READY', 'HARVESTED');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'MODERATE_STRESS', 'SEVERE_STRESS', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WEATHER_ALERT', 'IOT_ANOMALY', 'HARVEST_READY', 'HEALTH_DEGRADATION', 'SYSTEM_INFO');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TECHNICIAN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "areaHectares" DOUBLE PRECISION NOT NULL,
    "sugarcaneVariety" TEXT NOT NULL,
    "plantingDate" TIMESTAMP(3) NOT NULL,
    "growthStatus" "GrowthStatus" NOT NULL DEFAULT 'PLANTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_data" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "rainfall" DOUBLE PRECISION NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "pressure" DOUBLE PRECISION NOT NULL,
    "weatherDesc" TEXT NOT NULL,
    "forecastDate" TIMESTAMP(3),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'OpenWeatherMap',

    CONSTRAINT "weather_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fao_references" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fao_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_readings" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "soilMoisture" DOUBLE PRECISION NOT NULL,
    "soilPH" DOUBLE PRECISION NOT NULL,
    "soilTemperature" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ndvi_data" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "ndviValue" DOUBLE PRECISION NOT NULL,
    "healthStatus" "HealthStatus" NOT NULL,
    "captureDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'Copernicus',
    "satellitePass" TEXT,
    "cloudCover" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ndvi_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drone_flights" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "flightDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "altitudeMeters" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "imageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drone_flights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_decisions" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "decisionType" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "contextData" JSONB NOT NULL,
    "weatherFactors" JSONB,
    "soilFactors" JSONB,
    "ndviFactors" JSONB,
    "faoReferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_cache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "cacheValue" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "weather_data_fieldId_recordedAt_idx" ON "weather_data"("fieldId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "fao_references_category_subcategory_dataType_key" ON "fao_references"("category", "subcategory", "dataType");

-- CreateIndex
CREATE INDEX "sensor_readings_fieldId_timestamp_idx" ON "sensor_readings"("fieldId", "timestamp");

-- CreateIndex
CREATE INDEX "ndvi_data_fieldId_captureDate_idx" ON "ndvi_data"("fieldId", "captureDate");

-- CreateIndex
CREATE INDEX "drone_flights_fieldId_flightDate_idx" ON "drone_flights"("fieldId", "flightDate");

-- CreateIndex
CREATE INDEX "ai_decisions_fieldId_createdAt_idx" ON "ai_decisions"("fieldId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON "notifications"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_cache_cacheKey_key" ON "system_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "system_cache_cacheKey_expiresAt_idx" ON "system_cache"("cacheKey", "expiresAt");

-- AddForeignKey
ALTER TABLE "weather_data" ADD CONSTRAINT "weather_data_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ndvi_data" ADD CONSTRAINT "ndvi_data_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drone_flights" ADD CONSTRAINT "drone_flights_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drone_flights" ADD CONSTRAINT "drone_flights_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_decisions" ADD CONSTRAINT "ai_decisions_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
