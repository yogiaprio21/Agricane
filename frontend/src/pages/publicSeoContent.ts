import {
  Activity,
  BarChart3,
  Bot,
  CloudSun,
  Database,
  Gauge,
  Leaf,
  Map,
  Radar,
  Satellite,
  ShieldCheck,
  Sprout,
} from 'lucide-react';
import { SITE_URL } from '../hooks/usePageMeta';

export const publicNavItems = [
  { label: 'Features', href: '/features' },
  { label: 'Use cases', href: '/use-cases' },
  { label: 'Technology', href: '/technology' },
  { label: 'Demo', href: '/demo' },
];

export const platformFeatures = [
  {
    title: 'Field monitoring',
    description: 'Track plantation blocks, growth stage, field area, coordinates, and operational status in one responsive dashboard.',
    icon: Map,
  },
  {
    title: 'Environmental analytics',
    description: 'Combine OpenWeatherMap forecasts, rainfall history, humidity, and temperature trends for each sugarcane field.',
    icon: CloudSun,
  },
  {
    title: 'IoT sensor insights',
    description: 'Review soil moisture, pH, and temperature readings with live WebSocket updates and anomaly-focused summaries.',
    icon: Activity,
  },
  {
    title: 'NDVI crop health',
    description: 'Use satellite vegetation index history and drone flight logs to spot healthy, moderate stress, and severe stress fields.',
    icon: Satellite,
  },
  {
    title: 'Agronomy references',
    description: 'Surface FAO-style sugarcane guidance for irrigation, climate, soil, pest management, and crop recommendations.',
    icon: Sprout,
  },
  {
    title: 'AI recommendations',
    description: 'Generate irrigation, harvest readiness, and risk assessment decisions from field, weather, sensor, NDVI, and crop-age data.',
    icon: Bot,
  },
];

export const useCases = [
  {
    title: 'Plantation operations teams',
    description: 'Monitor every field from a single interface and prioritize attention based on growth stage, weather, sensor anomalies, and NDVI status.',
  },
  {
    title: 'Agronomists and crop advisors',
    description: 'Compare soil, rainfall, climate, and crop age signals before recommending irrigation or harvest actions.',
  },
  {
    title: 'Drone and remote-sensing workflows',
    description: 'Log drone flights, image counts, altitude, notes, and NDVI observations to keep field inspection history organized.',
  },
  {
    title: 'Portfolio and SaaS evaluation',
    description: 'Demonstrate full-stack agriculture software skills across NestJS, Prisma, Neon, Render, Vercel, React, maps, charts, and real-time data.',
  },
];

export const techStack = [
  { label: 'Frontend', value: 'React, Vite, TypeScript, Tailwind CSS, Recharts, Leaflet' },
  { label: 'Backend', value: 'NestJS, Prisma, PostgreSQL, JWT, RBAC, Socket.IO' },
  { label: 'Data platform', value: 'Neon PostgreSQL, Prisma migrations, modular seeders' },
  { label: 'Deploy', value: 'Vercel frontend, Render API, Neon database' },
  { label: 'Integrations', value: 'OpenWeatherMap, Sentinel Hub/Copernicus-ready NDVI, FAO-style agronomy references, SMTP notifications' },
];

export const keywordPages = {
  sugarcaneMonitoring: {
    path: '/sugarcane-monitoring',
    title: 'Sugarcane Monitoring Platform',
    description:
      'AgriCane is a sugarcane monitoring platform for tracking fields, weather, soil sensors, NDVI crop health, drone logs, and AI recommendations.',
    heading: 'Sugarcane monitoring platform for field, weather, sensor, and NDVI signals',
    intro:
      'AgriCane connects plantation field records with environmental analytics, IoT soil data, satellite vegetation indexes, drone observations, and agronomy references so crop teams can see field conditions before decisions become urgent.',
    points: [
      'Monitor sugarcane blocks with area, variety, growth stage, crop age, and location context.',
      'Review temperature, humidity, rainfall, forecast windows, and historical weather trends per field.',
      'Use NDVI and drone flight logs to compare crop health across fields and identify stress patterns.',
      'Generate decision support for irrigation, harvest readiness, and field risk from connected data.',
    ],
  },
  precisionDashboard: {
    path: '/precision-agriculture-dashboard',
    title: 'Precision Agriculture Dashboard',
    description:
      'Explore a precision agriculture dashboard built with React, NestJS, Neon, and Vercel for IoT, weather, NDVI, drone, and AI decision workflows.',
    heading: 'Precision agriculture dashboard for operational visibility',
    intro:
      'The public AgriCane demo shows how a focused agriculture dashboard can combine backend services, external APIs, responsive data visualization, and read-only visitor access for portfolio review.',
    points: [
      'Responsive dashboards for field, sensor, weather, satellite, agronomy, notification, and user workflows.',
      'Read-only demo access so visitors can inspect data without changing production records.',
      'Structured API integration with JWT security, role-based access, and deploy-ready database migrations.',
      'Portfolio-grade implementation across Vercel, Render, Neon, NestJS, Prisma, and React.',
    ],
  },
};

export const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AgriCane',
  url: SITE_URL,
  description:
    'Sugarcane intelligence platform for field monitoring, IoT sensor data, weather analytics, NDVI insights, drone logs, agronomy references, and AI recommendations.',
};

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AgriCane',
  url: SITE_URL,
  logo: `${SITE_URL}/agricane-logo.svg`,
};

export const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AgriCane Intelligence Platform',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  image: `${SITE_URL}/agricane-logo.svg`,
  description:
    'A web-based sugarcane intelligence platform for field monitoring, IoT sensors, weather analytics, NDVI crop health, drone logs, agronomy references, and AI decision support.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export const createBreadcrumbJsonLd = (items: Array<{ name: string; path: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${SITE_URL}${item.path}`,
  })),
});

export const impactStats = [
  { label: 'Core modules', value: '8', icon: Gauge },
  { label: 'Data sources', value: '5', icon: Database },
  { label: 'Decision types', value: '3', icon: BarChart3 },
  { label: 'Demo access', value: 'Read-only', icon: ShieldCheck },
];

export const monitoringSignals = [
  { label: 'Fields', value: 'Area, variety, status, crop age', icon: Leaf },
  { label: 'Weather', value: 'Forecast, rainfall, humidity, temperature', icon: CloudSun },
  { label: 'Sensors', value: 'Soil moisture, pH, soil temperature', icon: Activity },
  { label: 'Remote sensing', value: 'NDVI, drone logs, field health summary', icon: Radar },
];
