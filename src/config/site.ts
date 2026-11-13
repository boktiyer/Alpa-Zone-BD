// Shop contact details — change them here and the whole site updates.

export const site = {
  name: 'Alpa Zone BD',

  /** Shown in the footer and used for the "call" link. */
  phone: '01852294059',

  /** bKash / Nagad number customers send money to at checkout. */
  paymentNumber: '01852294059',

  /** WhatsApp number in international format, digits only (88 + number). */
  whatsapp: '8801852294059',

  facebook: 'https://www.facebook.com/alpazonebd',

  /** Leave empty to hide the Instagram link. */
  instagram: '',
};

/**
 * Customer reviews shown on the home page ("What our customers say").
 * Put REAL reviews here — for example copied from your Facebook page or
 * WhatsApp, with the customer's permission. The section stays hidden while
 * this list is empty.
 *
 *   { name: 'Customer name', place: 'Dhaka', rating: 5, text: 'What they wrote' },
 */
export const reviews: { name: string; place?: string; rating: number; text: string }[] = [];

/** https://wa.me link with an optional pre-written message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${site.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
