import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Phone, MessageSquare, StickyNote, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Communication {
  id: string;
  channel: 'whatsapp' | 'sms' | 'call' | 'note';
  message: string | null;
  status_at_time: string | null;
  created_at: string;
}

interface OrderCommunicationHistoryProps {
  orderId: string;
}

const channelIcons = {
  whatsapp: MessageCircle,
  sms: MessageSquare,
  call: Phone,
  note: StickyNote
};

const channelColors = {
  whatsapp: 'text-green-600 bg-green-50',
  sms: 'text-purple-600 bg-purple-50',
  call: 'text-blue-600 bg-blue-50',
  note: 'text-amber-600 bg-amber-50'
};

const channelLabels = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  call: 'Call',
  note: 'Note'
};

export function OrderCommunicationHistory({ orderId }: OrderCommunicationHistoryProps) {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCommunications = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('order_communications')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCommunications(data as Communication[]);
      }
      setIsLoading(false);
    };

    fetchCommunications();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (communications.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No communication history yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[200px] pr-4">
      <div className="space-y-3">
        {communications.map((comm) => {
          const Icon = channelIcons[comm.channel];
          const colorClass = channelColors[comm.channel];
          
          return (
            <div
              key={comm.id}
              className="flex gap-3 p-3 rounded-lg border bg-card"
            >
              <div className={`p-2 rounded-full ${colorClass} self-start`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">
                    {channelLabels[comm.channel]}
                  </span>
                  {comm.status_at_time && (
                    <Badge variant="outline" className="text-xs">
                      {comm.status_at_time}
                    </Badge>
                  )}
                </div>
                {comm.message && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {comm.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(comm.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
