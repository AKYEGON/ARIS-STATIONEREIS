import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CommunicationChannel, formatPhoneForWhatsApp, replaceTemplateVariables } from '@/types/communication';

interface LogCommunicationParams {
  orderId: string;
  channel: CommunicationChannel;
  message: string;
  statusAtTime: string;
}

export function useOrderCommunication() {
  const [isLogging, setIsLogging] = useState(false);
  const { toast } = useToast();

  const logCommunication = async ({ orderId, channel, message, statusAtTime }: LogCommunicationParams) => {
    setIsLogging(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('order_communications')
        .insert({
          order_id: orderId,
          channel,
          message,
          status_at_time: statusAtTime,
          created_by: user?.id || null
        });

      if (error) throw error;

      // Update last_contacted_at on the order
      await supabase
        .from('orders')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', orderId);

      return true;
    } catch (error) {
      console.error('Error logging communication:', error);
      toast({
        title: "Error",
        description: "Failed to log communication",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLogging(false);
    }
  };

  const openWhatsApp = (phone: string, message: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
  };

  const openSMS = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`sms:${phone}?body=${encodedMessage}`, '_self');
  };

  const openCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const getMessageForStatus = (
    status: string,
    order: { customer_name: string; id: string; total: number; delivery_address: string; customer_phone?: string }
  ): string => {
    const shortId = order.id.slice(0, 8).toUpperCase();
    // Note: Delivered / Picked Up messages are built by OrderStatusModal using
    // per-product review links from review-requests.ts. The fallbacks below
    // are only used if that preparation fails.
    const templates: Record<string, string> = {
      'Pending': `Hi ${order.customer_name}! Thank you for your order #${shortId} at ARIS STATIONERIES. We've received it and will process it shortly. Total: KSh ${order.total.toLocaleString()}`,
      'Processing': `Hi ${order.customer_name}! Great news - your order #${shortId} is now being prepared. We'll notify you once it's ready for delivery!`,
      'Shipped': `Hi ${order.customer_name}! Your order #${shortId} is on its way! Delivery address: ${order.delivery_address}. Questions? Reply here!`,
      'Delivered': `Hi ${order.customer_name}! Your order #${shortId} has been delivered. Thank you for shopping with ARIS STATIONERIES!`,
      'Picked Up': `Hi ${order.customer_name}! Thank you for picking up your order #${shortId} at ARIS STATIONERIES.`,
      'Cancelled': `Hi ${order.customer_name}, your order #${shortId} has been cancelled. If you have questions, please reach out. We hope to serve you again!`
    };
    
    return templates[status] || `Hi ${order.customer_name}! This is ARIS STATIONERIES regarding your order #${order.id.slice(0, 8).toUpperCase()}.`;
  };

  return {
    logCommunication,
    openWhatsApp,
    openSMS,
    openCall,
    getMessageForStatus,
    isLogging
  };
}
