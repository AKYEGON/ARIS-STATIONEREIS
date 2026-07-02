import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageCircle, Phone, MessageSquare, Send, SkipForward, Loader2, Star } from 'lucide-react';
import { useOrderCommunication } from '@/hooks/use-order-communication';
import { cn } from '@/lib/utils';
import {
  isReviewTriggerStatus,
  prepareReviewRequests,
  buildStatusReviewMessage,
  markReviewRequestsSent,
  type ReviewRequestRow,
} from '@/lib/review-requests';
import { toast } from 'sonner';

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
    order_items?: { product_name: string }[];
  };
  newStatus: string;
  onConfirm: (sendMessage: boolean) => void;
}

export function OrderStatusModal({ isOpen, onClose, order, newStatus, onConfirm }: OrderStatusModalProps) {
  const { getMessageForStatus, openWhatsApp, openSMS, openCall, logCommunication, isLogging } = useOrderCommunication();
  const reviewTrigger = isReviewTriggerStatus(newStatus);
  const [message, setMessage] = useState(() =>
    reviewTrigger ? '' : getMessageForStatus(newStatus, order)
  );
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'sms' | 'call'>('whatsapp');
  const [reviewRows, setReviewRows] = useState<ReviewRequestRow[]>([]);
  const [prepLoading, setPrepLoading] = useState(false);

  // Build the unified review message when status is Delivered / Picked Up
  useEffect(() => {
    if (!isOpen || !reviewTrigger) return;
    let cancelled = false;
    setPrepLoading(true);
    prepareReviewRequests(order)
      .then((rows) => {
        if (cancelled) return;
        setReviewRows(rows);
        setMessage(buildStatusReviewMessage(reviewTrigger, order, rows));
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          toast.error('Could not prepare review links - falling back to a plain message.');
          setMessage(getMessageForStatus(newStatus, order));
        }
      })
      .finally(() => {
        if (!cancelled) setPrepLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reviewTrigger, order.id]);

  const handleSendAndUpdate = async () => {
    await logCommunication({
      orderId: order.id,
      channel: selectedChannel,
      message: selectedChannel === 'call' ? 'Phone call made' : message,
      statusAtTime: newStatus
    });

    if (selectedChannel === 'whatsapp') {
      openWhatsApp(order.customer_phone, message);
    } else if (selectedChannel === 'sms') {
      openSMS(order.customer_phone, message);
    } else {
      openCall(order.customer_phone);
    }

    if (reviewTrigger && selectedChannel !== 'call' && reviewRows.length > 0) {
      try {
        await markReviewRequestsSent(order.id, selectedChannel);
      } catch (e) {
        console.error('Failed to mark review requests as sent', e);
      }
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>Update Order Status</span>
            <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", statusColors[newStatus] || 'bg-gray-100')}>
              {newStatus}
            </span>
            {reviewTrigger && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border border-green-200 bg-green-50 text-green-700">
                <Star className="h-3 w-3" /> Review request included
              </span>
            )}
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
              {prepLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center border rounded">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparing review links…
                </div>
              ) : (
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={reviewTrigger ? 10 : 4}
                  className="text-sm"
                />
              )}
              <p className="text-xs text-muted-foreground">
                {reviewTrigger
                  ? 'Each product has its own one-time review link. You can edit before sending.'
                  : 'You can edit the message before sending.'}
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
            disabled={isLogging || prepLoading}
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
