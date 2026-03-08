// TypeScript type definitions
export type { Product, CartItem, ProductMedia, ProductVariant } from './product';
export type { Bundle, BundleItem, CartBundle } from './bundle';
export type { CustomerTestimonial } from './testimonial';
export type {
  CommunicationChannel,
  OrderCommunication,
  MessageTemplate,
  OrderWithCommunication,
} from './communication';
export { formatPhoneForWhatsApp, replaceTemplateVariables } from './communication';
