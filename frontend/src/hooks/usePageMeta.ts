import { useEffect } from 'react';

const DEFAULT_TITLE = 'AgriCane Intelligence Platform';
const DEFAULT_DESCRIPTION =
  'AgriCane is a sugarcane intelligence platform for field monitoring, IoT sensors, weather analytics, NDVI, drone logs, agronomy references, and AI recommendations.';

const upsertMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
};

export const usePageMeta = (title?: string, description?: string) => {
  useEffect(() => {
    const resolvedTitle = title ? `${title} | AgriCane` : DEFAULT_TITLE;
    const resolvedDescription = description || DEFAULT_DESCRIPTION;

    document.title = resolvedTitle;
    upsertMeta('meta[name="description"]', 'name', 'description', resolvedDescription);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', resolvedTitle);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', resolvedDescription);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', resolvedTitle);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', resolvedDescription);

    return () => {
      document.title = DEFAULT_TITLE;
      upsertMeta('meta[name="description"]', 'name', 'description', DEFAULT_DESCRIPTION);
      upsertMeta('meta[property="og:title"]', 'property', 'og:title', DEFAULT_TITLE);
      upsertMeta('meta[property="og:description"]', 'property', 'og:description', DEFAULT_DESCRIPTION);
      upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', DEFAULT_TITLE);
      upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', DEFAULT_DESCRIPTION);
    };
  }, [title, description]);
};
