import type {
  ContentPage,
  ContentLink,
  FaqItem,
  FleetVehicle,
  ServicesBlock,
} from '@/services/companyContentServices';
import type { Tenant } from './tenant';
import { absoluteUrl, siteOrigin } from './seo';

type Node = Record<string, unknown>;

const CONTEXT = 'https://schema.org';

function prune<T extends Node>(node: T): T {
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (value === undefined || value === null || value === '') delete node[key];
    if (Array.isArray(value) && value.length === 0) delete node[key];
  }
  return node;
}

export function organizationNode(tenant: Tenant): Node {
  const seo = tenant.sections.seo;
  const origin = siteOrigin(tenant);
  return prune({
    '@type': 'Organization',
    name: seo?.og_site_name || tenant.name,
    telephone: tenant.footer.contact.phone,
    email: tenant.footer.contact.email,
    url: origin || undefined,
    sameAs: seo?.same_as,
    areaServed: seo?.geo_placename,
    founder: seo?.founders?.length
      ? seo.founders.map((name) => ({ '@type': 'Person', name }))
      : undefined,
  });
}

export function organizationSchema(tenant: Tenant): Node {
  return { '@context': CONTEXT, ...organizationNode(tenant) };
}

function faqNode(faqs: FaqItem[]): Node {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

function breadcrumbNode(tenant: Tenant, page: ContentPage, path: string): Node {
  const origin = siteOrigin(tenant);
  const trail =
    page.breadcrumb && page.breadcrumb.length
      ? page.breadcrumb
      : [
          { label: 'Home', href: '/' },
          { label: page.h1 || page.meta?.title || '', href: path },
        ];
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: item.href ? `${origin}${item.href.startsWith('/') ? '' : '/'}${item.href}` : undefined,
    })),
  };
}

function howToNode(page: ContentPage, name: string): Node {
  const steps = (page.blocks || [])
    .filter((b) => b.is_step)
    .map((b) => ({
      '@type': 'HowToStep',
      name: b.heading,
      text: (b.paragraphs || []).join(' '),
    }));
  return prune({ '@type': 'HowTo', name, step: steps });
}

export function contentPageSchema(tenant: Tenant, page: ContentPage, path: string): Node {
  const types = new Set(page.schema?.types || []);
  const url = absoluteUrl(tenant, path);
  const name = page.h1 || page.meta?.title || tenant.name;
  const seo = tenant.sections.seo;
  const graph: Node[] = [breadcrumbNode(tenant, page, path)];

  if (page.faqs?.length) graph.push(faqNode(page.faqs));

  if (types.has('Service')) {
    graph.push(
      prune({
        '@type': 'Service',
        name,
        serviceType: page.schema?.service_type,
        areaServed: seo?.geo_placename,
        provider: organizationNode(tenant),
        url,
      }),
    );
  }
  const vehicles = page.schema?.vehicles;
  if (vehicles?.length) {
    if (types.has('ItemList')) {
      graph.push({
        '@type': 'ItemList',
        itemListElement: vehicles.map((v, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: vehicleNode(tenant, v),
        })),
      });
    } else if (types.has('Vehicle')) {
      for (const v of vehicles) graph.push(vehicleNode(tenant, v));
    }
  }
  if (types.has('HowTo')) graph.push(howToNode(page, name));
  if (types.has('AboutPage')) {
    graph.push(prune({ '@type': 'AboutPage', name, url, mainEntity: organizationNode(tenant) }));
  }
  if (types.has('ContactPage')) graph.push(prune({ '@type': 'ContactPage', name, url }));
  if (types.has('AutoRental')) {
    graph.push(
      prune({
        '@type': 'AutoRental',
        name: seo?.og_site_name || tenant.name,
        telephone: tenant.footer.contact.phone,
        email: tenant.footer.contact.email,
        url,
        priceRange: page.schema?.price_range || seo?.price_range,
        areaServed: seo?.geo_placename,
      }),
    );
  }
  if (types.has('WebSite')) {
    graph.push(prune({ '@type': 'WebSite', name: seo?.og_site_name || tenant.name, url: siteOrigin(tenant) }));
  }
  if (types.has('Organization')) graph.push(organizationNode(tenant));

  return { '@context': CONTEXT, '@graph': graph };
}

export function faqPageSchema(faqs: FaqItem[]): Node {
  return { '@context': CONTEXT, ...faqNode(faqs) };
}

function trailNode(tenant: Tenant, trail: ContentLink[]): Node {
  const origin = siteOrigin(tenant);
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: item.href ? `${origin}${item.href.startsWith('/') ? '' : '/'}${item.href}` : undefined,
    })),
  };
}

export function serviceOverviewSchema(
  tenant: Tenant,
  blocks: ServicesBlock[],
  trail: ContentLink[],
): Node {
  const graph: Node[] = [
    trailNode(tenant, trail),
    {
      '@type': 'ItemList',
      itemListElement: blocks
        .filter((b) => b.heading)
        .map((b, i) =>
          prune({
            '@type': 'ListItem',
            position: i + 1,
            name: b.heading,
            url: b.href ? absoluteUrl(tenant, b.href) : undefined,
          }),
        ),
    },
  ];
  return { '@context': CONTEXT, '@graph': graph };
}

function vehicleNode(tenant: Tenant, v: FleetVehicle): Node {
  return prune({
    '@type': 'Vehicle',
    name: v.name || [v.year, v.make, v.model].filter(Boolean).join(' '),
    brand: v.make,
    model: v.model,
    vehicleModelDate: v.year,
    vehicleSeatingCapacity: v.seats,
    fuelType: v.fuel,
    offers: v.price
      ? {
          '@type': 'Offer',
          price: v.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          seller: organizationNode(tenant),
        }
      : undefined,
  });
}

export function fleetSchema(
  tenant: Tenant,
  vehicles: FleetVehicle[],
  faqs: FaqItem[] | undefined,
  trail: ContentLink[],
): Node {
  const graph: Node[] = [
    trailNode(tenant, trail),
    {
      '@type': 'ItemList',
      itemListElement: vehicles.map((v, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: vehicleNode(tenant, v),
      })),
    },
  ];
  if (faqs?.length) graph.push(faqNode(faqs));
  return { '@context': CONTEXT, '@graph': graph };
}
