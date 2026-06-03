import { useEffect } from 'react';

export const SITE_URL = 'https://agricane.vercel.app';
const DEFAULT_TITLE = 'AgriCane Intelligence Platform';
const DEFAULT_DESCRIPTION =
  'AgriCane is a sugarcane intelligence platform for field monitoring, IoT sensors, weather analytics, NDVI, drone logs, agronomy references, and AI recommendations.';
const DEFAULT_IMAGE = `${SITE_URL}/agricane-logo.svg`;

type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

interface PageMetaOptions {
  title?: string;
  description?: string;
  path?: string;
  robots?: string;
  image?: string;
  jsonLd?: JsonLdValue;
}

const resolveUrl = (pathOrUrl?: string) => {
  if (!pathOrUrl) return SITE_URL;
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
};

const upsertMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
};

const upsertLink = (selector: string, rel: string, href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>(selector);

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
};

const upsertJsonLd = (jsonLd?: JsonLdValue) => {
  const id = 'agricane-page-jsonld';
  let element = document.getElementById(id) as HTMLScriptElement | null;

  if (!jsonLd) {
    element?.remove();
    return;
  }

  if (!element) {
    element = document.createElement('script');
    element.id = id;
    element.type = 'application/ld+json';
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(jsonLd);
};

export const usePageMeta = (titleOrOptions?: string | PageMetaOptions, description?: string) => {
  useEffect(() => {
    const options: PageMetaOptions =
      typeof titleOrOptions === 'string'
        ? { title: titleOrOptions, description }
        : titleOrOptions || {};

    const resolvedTitle = options.title ? `${options.title} | AgriCane` : DEFAULT_TITLE;
    const resolvedDescription = options.description || DEFAULT_DESCRIPTION;
    const resolvedCanonical = resolveUrl(options.path);
    const resolvedImage = resolveUrl(options.image || DEFAULT_IMAGE);
    const resolvedRobots = options.robots || 'index, follow';

    document.title = resolvedTitle;
    upsertMeta('meta[name="description"]', 'name', 'description', resolvedDescription);
    upsertMeta('meta[name="robots"]', 'name', 'robots', resolvedRobots);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', resolvedTitle);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', resolvedDescription);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', resolvedCanonical);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', resolvedImage);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', resolvedTitle);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', resolvedDescription);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', resolvedImage);
    upsertLink('link[rel="canonical"]', 'canonical', resolvedCanonical);
    upsertJsonLd(options.jsonLd);

    return () => {
      document.title = DEFAULT_TITLE;
      upsertMeta('meta[name="description"]', 'name', 'description', DEFAULT_DESCRIPTION);
      upsertMeta('meta[name="robots"]', 'name', 'robots', 'index, follow');
      upsertMeta('meta[property="og:title"]', 'property', 'og:title', DEFAULT_TITLE);
      upsertMeta('meta[property="og:description"]', 'property', 'og:description', DEFAULT_DESCRIPTION);
      upsertMeta('meta[property="og:url"]', 'property', 'og:url', SITE_URL);
      upsertMeta('meta[property="og:image"]', 'property', 'og:image', DEFAULT_IMAGE);
      upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', DEFAULT_TITLE);
      upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', DEFAULT_DESCRIPTION);
      upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', DEFAULT_IMAGE);
      upsertLink('link[rel="canonical"]', 'canonical', SITE_URL);
      upsertJsonLd();
    };
  }, [titleOrOptions, description]);
};
