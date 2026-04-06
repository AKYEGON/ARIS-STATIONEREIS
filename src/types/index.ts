// TypeScript type definitions
export type { CartItem, Product, ProductCategory, ProductMedia, ProductVariant } from './product';
export type { Bundle, BundleItem, CartBundle } from './bundle';
export type { CustomerTestimonial } from './testimonial';
export type {
  CommunicationChannel,
  MessageTemplate,
  OrderCommunication,
  OrderWithCommunication,
} from './communication';
export { formatPhoneForWhatsApp, replaceTemplateVariables } from './communication';
