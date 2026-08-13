export interface CollectionNoticeConfiguration {
  contactHref: string;
  contactLabel: string;
  deployment: "production" | "staging";
}

export class CollectionNoticeConfigurationError extends Error {
  readonly name = "CollectionNoticeConfigurationError";

  constructor() {
    super("Customer-data collection is not configured safely.");
  }
}

function exactHttpsOrigin(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && !url.username
      && !url.password
      && url.pathname === "/"
      && !url.search
      && !url.hash
      && url.origin === value;
  } catch {
    return false;
  }
}

function validContactChannel(value: string | undefined): {
  href: string;
  label: string;
  fictional: boolean;
  placeholder: boolean;
} | null {
  const contact = value?.trim();
  if (!contact || contact.length > 200 || /[\u0000-\u001f\u007f]/.test(contact)) {
    return null;
  }
  if (/^tel:\+[1-9]\d{7,14}$/.test(contact)) {
    return {
      href: contact,
      label: contact.slice(4),
      fictional: false,
      placeholder: false,
    };
  }
  if (/^mailto:[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+$/i.test(contact)) {
    const address = contact.slice(7);
    if (
      address.includes("..")
      || address.startsWith(".")
      || address.endsWith(".")
      || !address.split("@")[1]?.includes(".")
    ) return null;
    const domain = address.split("@")[1]!.toLowerCase();
    return {
      href: contact,
      label: address,
      fictional: domain.endsWith(".invalid"),
      placeholder: domain.endsWith(".example")
        || domain.endsWith(".test")
        || ["example.com", "example.net", "example.org"].includes(domain),
    };
  }
  try {
    const url = new URL(contact);
    if (
      url.protocol !== "https:"
      || url.username
      || url.password
      || url.hash
      || url.href !== contact
    ) return null;
    const hostname = url.hostname.toLowerCase();
    return {
      href: contact,
      label: contact,
      fictional: hostname.endsWith(".invalid"),
      placeholder: hostname.endsWith(".example")
        || hostname.endsWith(".test")
        || ["example.com", "example.net", "example.org", "localhost"].includes(hostname),
    };
  } catch {
    return null;
  }
}

export function readCollectionNoticeConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): CollectionNoticeConfiguration {
  const production = exactHttpsOrigin(environment.DUM_PUBLIC_BASE_URL);
  const staging = exactHttpsOrigin(environment.DUM_STAGING_BASE_URL);
  const contactChannel = validContactChannel(
    environment.DUM_CUSTOMER_DATA_CONTACT,
  );
  if (production === staging || !contactChannel) {
    throw new CollectionNoticeConfigurationError();
  }
  if (
    contactChannel.placeholder
    || (staging && !contactChannel.fictional)
    || (production && contactChannel.fictional)
  ) {
    throw new CollectionNoticeConfigurationError();
  }
  return {
    contactHref: contactChannel.href,
    contactLabel: contactChannel.label,
    deployment: production ? "production" : "staging",
  };
}
