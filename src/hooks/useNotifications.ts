'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase/client';
import { withTimeout } from '@/lib/supabase/withTimeout';


export function useNotifications() {
  const supabase = supabaseClient;
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread'],
    retry: 1,
    retryDelay: 3000,
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { count, error } = await withTimeout(
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('is_read', false)
      );
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    retry: 1,
    retryDelay: 3000,
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data, error } = await withTimeout(
        supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
      );
      if (error) throw error;
      return data || [];
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  return { notifications, unreadCount, markAsRead };
}
