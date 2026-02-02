export type CommunicationChannel = 'whatsapp' | 'sms' | 'call' | 'note';

export interface OrderCommunication {
  id: string;
  order_id: string;
  channel: CommunicationChannel;
  message: string | null;
  status_at_time: string | null;
  created_at: string;
  created_by: string | null;
}

export interface MessageTemplate {
  id: string;
  name: string;
  trigger_status: string | null;
  channel: string;
  template: string;
  is_active: boolean;
  created_at: string;
}

export interface OrderWithCommunication {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  total: number;
  status: string;
  created_at: string;
  internal_notes: string | null;
  priority: string;
  follow_up_at: string | null;
  last_contacted_at: string | null;
}

export const formatPhoneForWhatsApp = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  }
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
};

export const replaceTemplateVariables = (
  template: string,
  order: {
    customer_name: string;
    id: string;
    total: number;
    delivery_address: string;
  }
): string => {
  return template
    .replace(/{customer_name}/g, order.customer_name)
    .replace(/{order_id}/g, order.id.slice(0, 8).toUpperCase())
    .replace(/{total}/g, order.total.toLocaleString())
    .replace(/{delivery_address}/g, order.delivery_address);
};
