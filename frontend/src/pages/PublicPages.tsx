import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  LockKeyhole,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react';
import { BrandLogo, BrandMark, Button } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import { usePageMeta } from '../hooks/usePageMeta';
import {
  createBreadcrumbJsonLd,
  impactStats,
  keywordPages,
  monitoringSignals,
  organizationJsonLd,
  platformFeatures,
  publicNavItems,
  softwareJsonLd,
  techStack,
  useCases,
  websiteJsonLd,
} from './publicSeoContent';

const PublicShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-white text-gray-950">
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="AgriCane home">
          <BrandLogo subtitle="Sugarcane intelligence" />
        </Link>
        <nav aria-label="Public navigation" className="hidden items-center gap-6 md:flex">
          {publicNavItems.map((item) => (
            <Link key={item.href} to={item.href} className="text-sm font-medium text-gray-600 hover:text-primary-700">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Login
          </Link>
          <Link
            to="/demo"
            className="hidden min-h-9 items-center justify-center rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700 sm:inline-flex"
          >
            Demo
          </Link>
        </div>
      </div>
    </header>
    <main>{children}</main>
    <footer className="border-t border-gray-200 bg-gray-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:px-8">
        <div>
          <BrandLogo textClassName="text-xl font-bold text-white" subtitle="Portfolio-ready agriculture intelligence" />
          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-300">
            AgriCane demonstrates full-stack agriculture software across field operations, weather analytics, IoT sensor monitoring,
            NDVI crop health, drone logs, agronomy references, notifications, and AI decision support.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {publicNavItems.map((item) => (
            <Link key={item.href} to={item.href} className="text-gray-300 hover:text-white">
              {item.label}
            </Link>
          ))}
          <Link to="/sugarcane-monitoring" className="text-gray-300 hover:text-white">
            Sugarcane monitoring
          </Link>
          <Link to="/precision-agriculture-dashboard" className="text-gray-300 hover:text-white">
            Precision dashboard
          </Link>
        </div>
      </div>
    </footer>
  </div>
);

const PublicHeroActions: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);

  const openDemo = async () => {
    setIsLoading(true);
    try {
      await login('viewer@agricane.com', 'admin123');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button onClick={openDemo} isLoading={isLoading} leftIcon={<PlayCircle size={18} />} size="lg">
        View read-only demo
      </Button>
      <Link
        to="/features"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-5 py-2.5 text-base font-semibold text-gray-800 hover:bg-gray-50"
      >
        Explore features <ArrowRight size={18} />
      </Link>
    </div>
  );
};

const SectionHeading: React.FC<{ eyebrow?: string; title: string; description?: string }> = ({
  eyebrow,
  title,
  description,
}) => (
  <div className="max-w-3xl">
    {eyebrow && <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">{eyebrow}</p>}
    <h2 className="mt-2 text-2xl font-bold tracking-normal text-gray-950 sm:text-3xl">{title}</h2>
    {description && <p className="mt-3 text-base leading-7 text-gray-600">{description}</p>}
  </div>
);

const PageIntro: React.FC<{ eyebrow: string; title: string; description: string }> = ({ eyebrow, title, description }) => (
  <div className="max-w-3xl">
    <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">{eyebrow}</p>
    <h1 className="mt-3 text-3xl font-bold leading-tight tracking-normal text-gray-950 sm:text-4xl">{title}</h1>
    <p className="mt-4 text-base leading-7 text-gray-600">{description}</p>
  </div>
);

const FeatureGrid = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {platformFeatures.map((feature) => {
      const Icon = feature.icon;
      return (
        <article key={feature.title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary-50 text-primary-700">
            <Icon size={22} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-950">{feature.title}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">{feature.description}</p>
        </article>
      );
    })}
  </div>
);

const DemoPreview = () => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-3">
          <BrandMark className="h-9 w-9" />
          <div>
            <p className="font-semibold text-gray-950">AgriCane dashboard</p>
            <p className="text-sm text-gray-500">Read-only portfolio preview</p>
          </div>
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">Live demo</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {monitoringSignals.map((signal) => {
          const Icon = signal.icon;
          return (
            <div key={signal.label} className="rounded-md border border-gray-200 bg-white p-4">
              <Icon className="text-primary-700" size={20} />
              <p className="mt-3 text-sm font-semibold text-gray-950">{signal.label}</p>
              <p className="mt-1 text-sm text-gray-600">{signal.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export const PublicHome: React.FC = () => {
  usePageMeta({
    title: 'Sugarcane Intelligence Platform',
    description:
      'AgriCane is a sugarcane intelligence platform for field monitoring, IoT soil sensors, weather analytics, NDVI crop health, drone logs, agronomy references, and AI recommendations.',
    path: '/',
    jsonLd: [websiteJsonLd, organizationJsonLd, softwareJsonLd],
  });

  return (
    <PublicShell>
      <section className="border-b border-gray-200 bg-primary-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-800">Portfolio-ready precision agriculture</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-normal text-gray-950 sm:text-5xl">
              AgriCane Intelligence Platform
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-700">
              Monitor sugarcane field health from field records, weather data, IoT sensors, NDVI analysis, drone observations,
              agronomy references, and AI decision support in one deploy-ready web platform.
            </p>
            <div className="mt-8">
              <PublicHeroActions />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {impactStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-lg border border-primary-100 bg-white px-4 py-3">
                    <Icon className="text-primary-700" size={19} />
                    <p className="mt-2 text-xl font-bold text-gray-950">{stat.value}</p>
                    <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <DemoPreview />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Platform capabilities"
          title="Built for complete sugarcane monitoring workflows"
          description="AgriCane keeps the portfolio demo practical: real CRUD flows, deployment-ready backend architecture, useful charts, maps, filters, read-only demo access, and external API integrations."
        />
        <div className="mt-8">
          <FeatureGrid />
        </div>
      </section>

      <section className="border-y border-gray-200 bg-gray-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <SectionHeading
            eyebrow="Why it matters"
            title="A focused agriculture SaaS portfolio project"
            description="The application shows production-minded engineering: modular NestJS APIs, Prisma migrations and seeders, role-based access, WebSocket updates, Neon database hosting, Render backend deploy, and Vercel frontend delivery."
          />
          <div className="grid gap-3">
            {useCases.map((item) => (
              <article key={item.title} className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="font-semibold text-gray-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
};

export const FeaturesPage: React.FC = () => {
  usePageMeta({
    title: 'Sugarcane Monitoring Features',
    description:
      'Explore AgriCane features for field monitoring, weather analytics, IoT sensor data, NDVI crop health, drone logs, agronomy references, and AI recommendations.',
    path: '/features',
    jsonLd: createBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Features', path: '/features' },
    ]),
  });

  return (
    <PublicShell>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <PageIntro
          eyebrow="Features"
          title="Field, climate, sensor, satellite, and decision workflows in one app"
          description="Each module is designed to make the demo inspectable for visitors while keeping data-changing actions protected by role-based access."
        />
        <div className="mt-8">
          <FeatureGrid />
        </div>
      </section>
    </PublicShell>
  );
};

export const UseCasesPage: React.FC = () => {
  usePageMeta({
    title: 'Agriculture Software Use Cases',
    description:
      'See how AgriCane supports plantation operations, agronomists, drone observations, portfolio review, and precision agriculture dashboard workflows.',
    path: '/use-cases',
    jsonLd: createBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Use cases', path: '/use-cases' },
    ]),
  });

  return (
    <PublicShell>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <PageIntro
          eyebrow="Use cases"
          title="Useful for field teams, agronomists, and portfolio reviewers"
          description="AgriCane demonstrates how agriculture data can be organized into clear workflows instead of scattered tables and disconnected charts."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {useCases.map((item) => (
            <article key={item.title} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <CheckCircle2 className="text-primary-700" size={22} />
              <h2 className="mt-4 text-lg font-semibold text-gray-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
};

export const TechnologyPage: React.FC = () => {
  usePageMeta({
    title: 'Technology Stack',
    description:
      'Review the AgriCane technology stack: React, Vite, TypeScript, NestJS, Prisma, Neon PostgreSQL, Render, Vercel, maps, charts, WebSocket, and external APIs.',
    path: '/technology',
    jsonLd: createBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Technology', path: '/technology' },
    ]),
  });

  return (
    <PublicShell>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <PageIntro
          eyebrow="Technology"
          title="Deploy-ready full-stack architecture"
          description="The stack is intentionally practical for a portfolio project: a fast Vite frontend, modular NestJS backend, Prisma schema and migrations, Neon PostgreSQL, Render API hosting, and Vercel static delivery."
        />
        <div className="mt-8 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {techStack.map((item) => (
            <div key={item.label} className="grid gap-2 px-5 py-4 sm:grid-cols-[180px_1fr]">
              <dt className="font-semibold text-gray-950">{item.label}</dt>
              <dd className="text-sm leading-6 text-gray-600">{item.value}</dd>
            </div>
          ))}
        </div>
      </section>
    </PublicShell>
  );
};

export const DemoPage: React.FC = () => {
  usePageMeta({
    title: 'Read-only Demo',
    description:
      'Open the AgriCane read-only demo to inspect sugarcane field data, IoT sensors, environmental analytics, NDVI monitoring, drone logs, agronomy, and AI recommendations.',
    path: '/demo',
    jsonLd: createBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Demo', path: '/demo' },
    ]),
  });

  return (
    <PublicShell>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <PageIntro
            eyebrow="Demo access"
            title="Inspect the dashboard without changing production data"
            description="The viewer role is designed for visitors. It can browse portfolio data but cannot create, update, generate, fetch, or delete records."
          />
          <div className="mt-8 flex flex-col gap-3">
            <PublicHeroActions />
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-primary-700">
              Use another account <ExternalLink size={16} />
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary-50 p-2 text-primary-700">
              <LockKeyhole size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-950">Read-only visitor role</h2>
              <p className="text-sm text-gray-600">viewer@agricane.com</p>
            </div>
          </div>
          <ul className="mt-6 space-y-3 text-sm text-gray-700">
            {[
              'Browse dashboard, fields, weather, IoT, satellite, agronomy, AI history, and notifications.',
              'Inspect portfolio data from Neon, Render, and Vercel deployment.',
              'Protected from data-changing actions through role-based access controls.',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <ShieldCheck className="mt-0.5 shrink-0 text-primary-700" size={18} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PublicShell>
  );
};

const KeywordPage: React.FC<{ page: typeof keywordPages.sugarcaneMonitoring }> = ({ page }) => {
  usePageMeta({
    title: page.title,
    description: page.description,
    path: page.path,
    jsonLd: createBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: page.title, path: page.path },
    ]),
  });

  return (
    <PublicShell>
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">AgriCane insight</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight tracking-normal text-gray-950 sm:text-4xl">{page.heading}</h1>
        <p className="mt-5 text-lg leading-8 text-gray-700">{page.intro}</p>
        <div className="mt-8 grid gap-3">
          {page.points.map((point) => (
            <div key={point} className="flex gap-3 rounded-lg border border-gray-200 bg-white p-4">
              <CheckCircle2 className="mt-0.5 shrink-0 text-primary-700" size={20} />
              <p className="text-sm leading-6 text-gray-700">{point}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <PublicHeroActions />
        </div>
      </section>
    </PublicShell>
  );
};

export const SugarcaneMonitoringPage = () => <KeywordPage page={keywordPages.sugarcaneMonitoring} />;

export const PrecisionAgricultureDashboardPage = () => <KeywordPage page={keywordPages.precisionDashboard} />;

export const PublicNotFound: React.FC = () => {
  usePageMeta({
    title: 'Page Not Found',
    description: 'The requested AgriCane page could not be found.',
    path: '/not-found',
    robots: 'noindex, nofollow',
  });

  return (
    <PublicShell>
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-950">Page not found</h1>
        <p className="mt-3 text-gray-600">This public AgriCane page does not exist or has moved.</p>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-10 items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Back to home
        </Link>
      </section>
    </PublicShell>
  );
};
