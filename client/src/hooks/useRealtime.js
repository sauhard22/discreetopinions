import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Subscribe to realtime INSERT events on a table, filtered by a column.
 * Calls `onInsert(newRow)` whenever a matching row is inserted.
 *
 * @param {string} table - Table name ('messages' or 'replies')
 * @param {string} filterColumn - Column to filter on (e.g. 'receiver_id')
 * @param {string} filterValue - Value to match
 * @param {function} onInsert - Callback with the new row
 */
export function useRealtime(table, filterColumn, filterValue, onInsert) {
  useEffect(() => {
    if (!supabase || !filterValue) return;

    const channel = supabase
      .channel(`${table}_${filterValue}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table,
          filter: `${filterColumn}=eq.${filterValue}`,
        },
        (payload) => {
          onInsert(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filterColumn, filterValue]);
}

/**
 * Subscribe to realtime INSERT events on replies for multiple message IDs.
 * Calls `onInsert(newReply)` for any reply to the given messages.
 *
 * @param {string[]} messageIds - Array of message IDs to watch
 * @param {function} onInsert - Callback with the new reply row
 */
export function useRealtimeReplies(messageIds, onInsert) {
  useEffect(() => {
    if (!supabase || !messageIds || messageIds.length === 0) return;

    // Subscribe to all replies on the replies table and filter client-side
    // (Supabase realtime filter only supports single value, not IN)
    const channel = supabase
      .channel(`replies_${messageIds[0]}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'replies',
        },
        (payload) => {
          if (messageIds.includes(payload.new.message_id)) {
            onInsert(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageIds.join(',')]);
}
