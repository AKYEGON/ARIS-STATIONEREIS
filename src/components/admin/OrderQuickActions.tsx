import { MessageCircle, Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOrderCommunication } from '@/hooks/use-order-communication';

interface OrderQuickActionsProps {
  order: {
    id: string;
    customer_name: string;
    customer_phone: string;
    total: number;
    delivery_address: string;
    status: string;
  };
  onActionComplete?: () => void;
}

export function OrderQuickActions({ order, onActionComplete }: OrderQuickActionsProps) {
  const { openWhatsApp, openSMS, openCall, getMessageForStatus, logCommunication } = useOrderCommunication();

  const handleWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = getMessageForStatus(order.status, order);
    await logCommunication({
      orderId: order.id,
      channel: 'whatsapp',
      message,
      statusAtTime: order.status
    });
    openWhatsApp(order.customer_phone, message);
    onActionComplete?.();
  };

  const handleSMS = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = getMessageForStatus(order.status, order);
    await logCommunication({
      orderId: order.id,
      channel: 'sms',
      message,
      statusAtTime: order.status
    });
    openSMS(order.customer_phone, message);
    onActionComplete?.();
  };

  const handleCall = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await logCommunication({
      orderId: order.id,
      channel: 'call',
      message: 'Phone call made',
      statusAtTime: order.status
    });
    openCall(order.customer_phone);
    onActionComplete?.();
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>WhatsApp {order.customer_name}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={handleCall}
            >
              <Phone className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Call {order.customer_name}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              onClick={handleSMS}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>SMS {order.customer_name}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
