import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageCircle, Phone, MessageSquare, Send, SkipForward } from 'lucide-react';
import { useOrderCommunication } from '@/hooks/use-order-communication';
import { cn } from '@/lib/utils';

interface OrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    customer_name: string;
    customer_phone: string;
    total: number;
    delivery_address: string;
    status: string;
  };
  newStatus: string;
  onConfirm: (sendMessage: boolean) => void;
}

export function OrderStatusModal({ isOpen, onClose, order, newStatus, onConfirm }: OrderStatusModalProps) {
  const { getMessageForStatus, openWhatsApp, openSMS, openCall, logCommunication, isLogging } = useOrderCommunication();
  const [message, setMessage] = useState(() => getMessageForStatus(newStatus, order));
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'sms' | 'call'>('whatsapp');

  const handleSendAndUpdate = async () => {
    // Log the communication
    await logCommunication({
      orderId: order.id,
      channel: selectedChannel,
      message: selectedChannel === 'call' ? 'Phone call made' : message,
      statusAtTime: newStatus
    });

    // Open the communication channel
    if (selectedChannel === 'whatsapp') {
      openWhatsApp(order.customer_phone, message);
    } else if (selectedChannel === 'sms') {
      openSMS(order.customer_phone, message);
    } else {
      openCall(order.customer_phone);
    }

    onConfirm(true);
    onClose();
  };

  const handleSkip = () => {
    onConfirm(false);
    onClose();
  };

  const statusColors: Record<string, string> = {
    'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Processing': 'bg-blue-100 text-blue-800 border-blue-200',
    'Shipped': 'bg-purple-100 text-purple-800 border-purple-200',
    'Delivered': 'bg-green-100 text-green-800 border-green-200',
    'Cancelled': 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Update Order Status</span>
            <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", statusColors[newStatus] || 'bg-gray-100')}>
              {newStatus}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium">{order.customer_name}</p>
            <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
            <p className="text-xs text-muted-foreground">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          </div>

          <div className="space-y-2">
            <Label>Notify customer via:</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={selectedChannel === 'whatsapp' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChannel('whatsapp')}
                className="flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                WhatsApp
              </Button>
              <Button
                type="button"
                variant={selectedChannel === 'sms' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChannel('sms')}
                className="flex-1"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                SMS
              </Button>
              <Button
                type="button"
                variant={selectedChannel === 'call' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChannel('call')}
                className="flex-1"
              >
                <Phone className="h-4 w-4 mr-1" />
                Call
              </Button>
            </div>
          </div>

          {selectedChannel !== 'call' && (
            <div className="space-y-2">
              <Label htmlFor="message">Message Preview</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                You can edit the message before sending.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1"
          >
            <SkipForward className="h-4 w-4 mr-1" />
            Skip & Update Only
          </Button>
          <Button
            onClick={handleSendAndUpdate}
            disabled={isLogging}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-1" />
            {selectedChannel === 'call' ? 'Call & Update' : 'Send & Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
