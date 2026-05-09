'use client';

import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Info,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatShortDate } from '@/lib/utils';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const getTypeIcon = (type: string): LucideIcon => {
    switch (type) {
      case 'low_stock':
      case 'out_of_stock':
      case 'error':
        return AlertTriangle;
      case 'sale_success':
        return CheckCircle2;
      case 'sync_complete':
        return RefreshCw;
      default:
        return Info;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full transition-colors hover:bg-rose-light/60 text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-400 text-[10px] font-medium text-white shadow-sm">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 overflow-hidden p-0 rounded-2xl border border-rose-soft/20 bg-white/95 backdrop-blur-md shadow-lg" align="end">
        <div className="border-b border-rose-soft/20 bg-rose-light/30 px-4 py-3 text-sm font-semibold text-foreground">
          Notifications {unreadCount > 0 && <span className="text-primary">({unreadCount})</span>}
        </div>
        <ScrollArea className="h-64">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
              <BellOff className="h-6 w-6 mb-2 text-muted-foreground/40" />
              Aucune notification
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = getTypeIcon(notif.type);

              return (
                <button
                  key={notif.id}
                  onClick={() => !notif.is_read && markAsRead.mutate(notif.id)}
                  className={cn(
                    'w-full border-b border-rose-soft/10 px-4 py-3 text-left transition-colors last:border-0 hover:bg-rose-light/20',
                    !notif.is_read && 'bg-rose-light/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-light/40 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {notif.title}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground mt-0.5">
                        {notif.message}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/60">
                        {formatShortDate(notif.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}