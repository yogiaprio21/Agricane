import { Role, GrowthStatus, HealthStatus, NotificationPriority } from './enums';

export * from './enums';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Field {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  locationName?: string;
  areaHectares: number;
  sugarcaneVariety: string;
  plantingDate: string;
  growthStatus: GrowthStatus;
  cropAgeDays?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeatherData {
  id: string;
  fieldId: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  pressure: number;
  weatherDesc: string;
  recordedAt: string;
  source?: string;
  sourceType?: 'LIVE' | 'CACHE' | 'FALLBACK' | 'SIMULATED';
  provider?: string;
  fetchedAt?: string;
}

export interface SensorReading {
  id: string;
  fieldId: string;
  soilMoisture: number;
  soilPH: number;
  soilTemperature: number;
  timestamp: string;
}

export interface NDVIData {
  id: string;
  fieldId: string;
  ndviValue: number;
  healthStatus: HealthStatus;
  captureDate: string;
  source: string;
  sourceType?: 'LIVE' | 'CACHE' | 'FALLBACK' | 'SIMULATED';
  apiStatus?: string;
  provider?: string;
  metadata?: any;
}

export interface DroneFlight {
  id: string;
  fieldId: string;
  operatorId: string;
  flightDate: string;
  duration: number;
  altitudeMeters: number;
  notes?: string;
  imageCount: number;
  field?: {
    id: string;
    name: string;
  };
  operator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AIDecision {
  id: string;
  fieldId: string;
  decisionType: string;
  recommendation: string;
  explanation: string;
  confidence: number;
  contextData: any;
  weatherFactors?: any;
  soilFactors?: any;
  ndviFactors?: any;
  faoReferences?: any;
  createdAt: string;
}

export interface AIDecisionPrerequisites {
  fieldId: string;
  cropAge: number;
  sourceMode: string;
  canGenerate: {
    irrigation: boolean;
    harvestReadiness: boolean;
    riskAssessment: boolean;
  };
  missing: {
    irrigation: string[];
    harvestReadiness: string[];
    riskAssessment: string[];
  };
  latestData: {
    sensor: any | null;
    weather: any | null;
    ndvi: any | null;
  };
}

export interface Notification {
  id: string;
  type: string;
  priority: NotificationPriority;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

export interface FieldHealth {
  fieldId: string;
  fieldName: string;
  latestNDVI: number | null;
  healthStatus: string;
  lastUpdated: string | null;
}

export interface WeatherStats {
  avgTemperature: number;
  avgHumidity: number;
  totalRainfall: number;
  dataPoints: number;
}

export interface WeatherForecastItem {
  datetime: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  weatherDesc: string;
}

export interface WeatherForecastResponse {
  fieldId: string;
  fieldName: string;
  sourceType: 'LIVE' | 'CACHE' | 'FALLBACK' | 'SIMULATED';
  provider: string;
  fetchedAt: string;
  forecast: WeatherForecastItem[];
}

export interface SensorStats {
  avgSoilMoisture: number;
  avgSoilPH: number;
  avgSoilTemperature: number;
  minSoilMoisture: number;
  maxSoilMoisture: number;
  dataPoints: number;
}

// Agronomy Types
export interface FAOReference {
  id: string;
  category: string;
  subcategory: string;
  dataType: string;
  content: any;
  metadata?: any;
  lastFetchedAt: string;
}

export interface IrrigationRecommendation {
  waterNeededMm?: number;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
  reasoning?: string;
  status?: string;
  currentMoisture?: number;
  targetMoisture?: number;
  temperature?: number;
  cropAge?: number;
  faoReference?: any;
  nextIrrigationDue?: string;
}

export interface SoilHealthAssessment {
  phStatus?: 'ACIDIC' | 'OPTIMAL' | 'ALKALINE';
  phScore?: number;
  recommendation?: string;
  suitableCrops?: string[];
  assessment?: string;
  status?: string;
  currentPH?: number;
  optimalRange?: {
    min: number;
    max: number;
  };
  faoReference?: any;
  organicMatter?: number;
}

export interface IntegrationStatus {
  name: string;
  state: 'healthy' | 'configured' | 'missing' | 'disabled' | 'error';
  provider?: string;
  details?: string;
  checkedAt: string;
}

export interface IntegrationStatusResponse {
  status: 'ok' | 'degraded';
  checkedAt: string;
  integrations: IntegrationStatus[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
