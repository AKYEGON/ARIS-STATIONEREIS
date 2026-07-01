import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, MessageCircle, QrCode, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatPhoneForWhatsApp } from '@/types/communication';

interface QuickSaleSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  saleData: {
    orderId: string;
    total: number;
    itemCount: number;
    customerName: string;
    customerPhone: string;
  };
}

export function QuickSaleSuccessDialog({ open, onClose, saleData }: QuickSaleSuccessDialogProps) {
  const orderRef = saleData.orderId ? saleData.orderId.slice(0, 8).toUpperCase() : '';
  const customerNameEncoded = encodeURIComponent(saleData.customerName);
  const customerPhoneEncoded = saleData.customerPhone !== 'N/A' ? encodeURIComponent(saleData.customerPhone) : '';
  const reviewLink = `https://arisstationaries.co.ke/testimonials?review=true&name=${customerNameEncoded}&phone=${customerPhoneEncoded}`;
  
  // Match the exact same message format as the "Delivered" status template
  const reviewMessage = saleData.customerName && saleData.customerName !== 'Walk-in Customer'
    ? `Hi ${saleData.customerName}! Your order #${orderRef} has been delivered. Thank you for shopping with ARIS! 💙

We'd love to hear about your experience! Share a quick review here:
${reviewLink}`
    : `Hi! Your order #${orderRef} has been delivered. Thank you for shopping at ARIS! 💙

We'd love to hear about your experience! Share a quick review here:
${reviewLink}`;

  const handleSendWhatsApp = () => {
    const formattedPhone = formatPhoneForWhatsApp(saleData.customerPhone);
    const encodedMessage = encodeURIComponent(reviewMessage);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
  };

  const hasValidPhone = saleData.customerPhone && saleData.customerPhone !== 'N/A' && saleData.customerPhone.length >= 9;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <CheckCircle className="h-6 w-6" />
            Sale Completed!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sale Summary */}
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-3xl font-bold text-primary">KSh {saleData.total.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {saleData.itemCount} item{saleData.itemCount !== 1 ? 's' : ''} sold
              {orderRef && ` • Order #${orderRef}`}
            </p>
          </div>

          {/* QR Code Section */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <QrCode className="h-4 w-4" />
              <span>Show this QR code to collect a review</span>
            </div>
            <div className="inline-block p-4 bg-white rounded-xl shadow-sm border">
              <QRCodeSVG 
                value={reviewLink} 
                size={160}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Customer can scan to leave feedback
            </p>
          </div>

          {/* WhatsApp Review Request */}
          {hasValidPhone && (
            <div className="border-t pt-4">
              <p className="text-sm text-center text-muted-foreground mb-3">
                Or send a review request via WhatsApp
              </p>
              <Button
                onClick={handleSendWhatsApp}
                variant="outline"
                className="w-full gap-2"
              >
                <MessageCircle className="h-4 w-4 text-green-500" />
                Send Review Request to {saleData.customerPhone}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
