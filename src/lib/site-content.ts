import { paths } from '@/lib/paths';

export type FeatureIcon = 'shield' | 'check' | 'pin';

export interface HomeContent {
  hero: {
    pill: string;
    headingLines: string[];
    subheading: string;
  };
  promo: {
    badge: string;
    text: string;
    ctaLabel: string;
  };
  featureColumns: { title: string; description: string }[];
  fleet: {
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
  };
  whyChoose: {
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
    image: string;
  };
  categories: {
    eyebrow: string;
    title: string;
    description: string;
    items: { name: string; price: string; image: string; href: string }[];
  };
  testimonials: {
    eyebrow: string;
    title: string;
    items: { quote: string; name: string; role: string; initials: string }[];
  };
  faq: {
    eyebrow: string;
    title: string;
    items: { question: string; answer: string }[];
  };
  cta: {
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
  };
}

export interface SiteContent {
  home: HomeContent;
  hero: {
    heading: string;
    subheading: string;
  };
  fleetPreview: {
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
  };
  features: {
    eyebrow: string;
    title: string;
    items: { icon: FeatureIcon; title: string; description: string }[];
  };
  about: {
    eyebrow: string;
    title: string;
    intro: string;
    bullets: string[];
    image: string;
  };
  faqs: {
    eyebrow: string;
    title: string;
    items: { question: string; answer: string }[];
  };
  cta: {
    title: string;
    description: string;
    buttonLabel: string;
  };
  terms: {
    intro: string;
    signTitle: string;
    signIntro: string;
    sections: { heading: string; paras: string[] }[];
  };
}

const FLEET_HQ_CONTENT: SiteContent = {
  home: {
    hero: {
      pill: '{company} Car Rental',
      headingLines: ['Your Journey, Perfected.', '{company}.'],
      subheading:
        "Experience the reliability of 30 years in automotive excellence. From fuel-efficient commuters to luxury SUVs, we provide premium service that puts you back in the driver's seat.",
    },
    promo: {
      badge: '20% OFF',
      text: 'Up to 20% discount on rental cars on weekends!',
      ctaLabel: 'Save Now',
    },
    featureColumns: [
      {
        title: '30+ Years of Expertise',
        description: 'We know vehicles inside and out, ensuring every car in our fleet is meticulously maintained.',
      },
      {
        title: 'Proven 5-Star Track Record',
        description: 'Our reputation is built on hundreds of successful rentals and happy drivers.',
      },
      {
        title: 'Local Convenience',
        description: 'Located right in the heart of Farmington, CT, for easy pickups and drop-offs.',
      },
    ],
    fleet: {
      eyebrow: 'Our Fleet',
      title: 'Ready for Any Destination',
      description:
        'Whether you need a fuel-efficient commuter for a business trip or a luxury SUV for a family getaway, our meticulously maintained fleet is ready for the road. No middlemen, no hidden fees, just reliable vehicles and personalized service from a local team you can trust.',
      ctaLabel: 'Explore More',
    },
    whyChoose: {
      eyebrow: 'Why Choose Us',
      title: 'Three decades of know-how, now in your neighborhood.',
      description:
        "After 30 years in the automotive business and three years as Top-Rated Turo hosts, we've brought our boutique rental experience directly to Farmington — trading marketplace fees for personal service and meticulously maintained vehicles, with no middleman.",
      ctaLabel: 'Browse the fleet',
      image: '/images/home-about.png',
    },
    categories: {
      eyebrow: 'Browse by Type',
      title: 'Car For Every Occasion',
      description:
        "From fuel-efficient commuters to luxury SUVs, pick the category that fits your trip and we'll show you everything available.",
      items: [
        { name: 'Small Cars', price: '$44.25', image: '/images/category-luxury.png', href: paths.fleet },
        { name: 'Sedans', price: '$54.75', image: '/images/category-luxury.png', href: paths.fleet },
        { name: 'Compact & SUVs', price: '$67.30', image: '/images/car-santafe.png', href: paths.fleet },
        { name: 'Premium Luxury', price: '$129.50', image: '/images/car-cherokee.png', href: paths.fleet },
        { name: 'People Carriers', price: '$74.25', image: '/images/car-cherokee.png', href: paths.fleet },
        { name: 'Electric & Hybrid', price: '$67.30', image: '/images/car-santafe.png', href: paths.fleet },
      ],
    },
    testimonials: {
      eyebrow: 'What Our Customers Say',
      title: 'Trusted by Hundreds of Travelers',
      items: [
        {
          quote:
            'The booking process was seamless and the car was spotless. Pickup in Farmington took all of five minutes.',
          name: 'Rachael M.',
          role: 'Hartford, CT',
          initials: 'RM',
        },
        {
          quote:
            "Better rates than the big airport counters and a genuinely personal touch. I won't rent anywhere else.",
          name: 'Peter D.',
          role: 'New Haven, CT',
          initials: 'PD',
        },
        {
          quote:
            "They walked me through everything and the SUV was ready exactly on time. Five stars isn't enough.",
          name: 'Davide L.',
          role: 'Farmington, CT',
          initials: 'DL',
        },
      ],
    },
    faq: {
      eyebrow: 'Got any questions?',
      title: 'Frequently Asked Questions',
      items: [
        {
          question: 'What are the requirements to rent a car in Farmington, CT?',
          answer:
            'To rent a vehicle with us, you must be at least 21 years of age, hold a valid driver’s license, and provide proof of active auto insurance. Please note that renters under the age of 25 may be subject to a standard “Young Driver” fee, which is a common practice across the industry. We pride a transparent booking process, so all requirements are clearly stated before you finalize your reservation.',
        },
        {
          question: 'How does your 30 years of experience benefit my rental?',
          answer:
            "Three decades in the automotive industry means every vehicle in our fleet is inspected, serviced and detailed to a standard the big rental chains can't match. You get a meticulously maintained car and a team that genuinely knows what they're handing you the keys to.",
        },
        {
          question: 'Do you offer airport pick-ups or local delivery in Connecticut?',
          answer:
            "Yes. We offer convenient pick-up near Bradley International Airport and complimentary local delivery throughout the greater Farmington area. Just let us know your preferred location and time during booking and we'll have the vehicle ready.",
        },
        {
          question: 'What is your fuel and mileage policy?',
          answer:
            'Vehicles are provided with a full tank and should be returned full to avoid a refueling charge. Standard rentals include a generous daily mileage allowance; unlimited-mileage options are available on request for longer trips.',
        },
      ],
    },
    cta: {
      eyebrow: 'Start Your Journey',
      title: 'Ready to hit the road?',
      description:
        'Browse the fleet, choose your vehicle, and book online in minutes. Simple, transparent, and ready when you are.',
      ctaLabel: 'Browse the Fleet',
    },
  },
  hero: {
    heading: 'Rent the exact car you want',
    subheading:
      'Browse our hand-picked fleet, book in minutes, and hit the road with transparent pricing and a local team that has your back from pickup to drop-off.',
  },
  fleetPreview: {
    eyebrow: 'Our Fleet',
    title: 'Browse our most-booked vehicles',
    description:
      'From rugged SUVs to executive sedans — every vehicle is detailed, inspected, and ready for your next trip.',
    ctaLabel: 'Explore full fleet',
  },
  features: {
    eyebrow: 'Why choose us',
    title: 'Renting made simple',
    items: [
      {
        icon: 'shield',
        title: 'Transparent pricing',
        description:
          'No hidden fees, no surprises at the counter. The price you see is the price you pay — protection and extras itemized up front.',
      },
      {
        icon: 'check',
        title: 'Clean, reliable fleet',
        description:
          'Every vehicle is meticulously detailed and inspected before each rental, so you drive away in a car that feels brand new.',
      },
      {
        icon: 'pin',
        title: 'Local, friendly service',
        description:
          'A local team that treats every trip like our own — quick handovers, flexible pickups, and real people when you need them.',
      },
    ],
  },
  about: {
    eyebrow: 'About us',
    title: 'About {company}',
    intro:
      'We believe renting a car should be effortless and honest. That means a clean, well-maintained fleet, pricing you can trust, and a local team that genuinely cares about making your trip a great one.',
    bullets: ['Modern, well-maintained fleet', 'Transparent, all-in pricing', 'Unlimited mileage on every rental'],
    image: '/images/car-cherokee.png',
  },
  faqs: {
    eyebrow: 'FAQs',
    title: 'Frequently asked questions',
    items: [
      {
        question: 'Who is eligible to rent a vehicle?',
        answer:
          "Drivers must be at least 21 years old with a valid driver's license held for a minimum of one year. A major credit or debit card in the renter's name and proof of insurance are required at pickup.",
      },
      {
        question: 'Where can I pick up and drop off my car?',
        answer:
          'We offer convenient pickup and drop-off across all of our listed locations. You can return the car to the same location, or choose a different drop-off location when you search.',
      },
      {
        question: 'What do I need to bring at pickup?',
        answer:
          "Bring your valid driver's license, the credit or debit card used for the reservation, and proof of insurance if you chose to use your own coverage. Verification is completed online before you arrive.",
      },
      {
        question: 'Is there a mileage limit?',
        answer:
          'All of our rentals come with unlimited mileage, so you can explore freely without worrying about the odometer or per-mile charges.',
      },
    ],
  },
  cta: {
    title: 'Ready to hit the road?',
    description: "Find your car, book in minutes, and pick up with zero hassle. We'll take care of the rest.",
    buttonLabel: 'Browse the fleet',
  },
  terms: {
    intro:
      'Our fleet is clean, reliable, and ready for the road. Please review the agreement below before confirming your reservation — no surprises, no hidden fees.',
    signTitle: 'Sign this agreement',
    signIntro:
      "Confirm you've read the terms above, then sign below to accept. Your electronic signature is legally binding.",
    sections: [
      {
        heading: '1. Eligibility & Driver Requirements',
        paras: [
          "To rent a vehicle from {company}, the primary driver must be at least 21 years of age and hold a valid, unexpired driver's license. Drivers between 21 and 24 may be subject to a standard Young Driver surcharge, which will be disclosed clearly at the time of booking.",
          "All drivers must provide proof of active automobile insurance and a valid form of payment in the renter's name. Additional authorized drivers must be present at pickup and meet the same eligibility requirements.",
        ],
      },
      {
        heading: '2. Reservations & Payment',
        paras: [
          'A reservation is confirmed once a deposit has been authorized against the payment method provided. The renter must be the cardholder and may be asked to present the physical card at pickup. Prepaid rates are charged in full at the time of reservation.',
          'Rates quoted include the base daily rate and any extras you select. Applicable taxes and fees, where they apply, are itemized on your invoice before you confirm.',
        ],
      },
      {
        heading: '3. Insurance, Protection & Liability',
        paras: [
          'Renters may provide their own qualifying insurance or select one of our protection plans at checkout. The renter is responsible for the vehicle for the full duration of the rental and assumes liability for any damage, loss, or fines not covered by the selected plan.',
          'Any incident, accident, or mechanical issue must be reported to {company} immediately. Failure to report may void applicable coverage.',
        ],
      },
      {
        heading: '4. Fuel, Mileage & Returns',
        paras: [
          'Vehicles are supplied with a full tank of fuel and must be returned full unless the Prepaid Fuel option was purchased. A refueling service charge applies to vehicles returned below the starting fuel level.',
          "Standard rentals include a generous daily mileage allowance. Vehicles must be returned to the agreed drop-off location at the scheduled time. Late returns may incur an additional day's charge.",
        ],
      },
      {
        heading: '5. Cancellations & Modifications',
        paras: [
          'Reservations may be cancelled or modified through your booking dashboard. Cancellations made within the free-cancellation window are fully refundable. Trip extensions, reductions, and vehicle swaps are subject to availability and any applicable price difference.',
        ],
      },
    ],
  },
};

const HARBOR_CONTENT: SiteContent = {
  ...FLEET_HQ_CONTENT,
  hero: {
    heading: 'Your coast, your car, your way',
    subheading:
      'Clean vehicles, honest pricing, and a local Miami team that makes pickup effortless — book in minutes and get on the road.',
  },
  about: {
    ...FLEET_HQ_CONTENT.about,
    intro:
      'Coastal car rentals done right. A spotless, well-maintained fleet, pricing with nothing hidden, and a team that treats every trip like our own.',
    bullets: ['Locally owned in Miami Beach', '5-star rated service', 'Unlimited mileage on every rental'],
  },
};

const CONTENT: Record<string, SiteContent> = {
  'fleet-hq': FLEET_HQ_CONTENT,
  'harbor-drive': HARBOR_CONTENT,
};

export function getSiteContent(slug: string): SiteContent {
  return CONTENT[slug] ?? FLEET_HQ_CONTENT;
}

export function withCompany(text: string, company: string): string {
  return text.replaceAll('{company}', company);
}
