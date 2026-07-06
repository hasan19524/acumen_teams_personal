// features/chat/utils/grouping.ts

import { Message } from "../types/message";

/**
 * Determines if consecutive messages are from the same sender
 * for compact grouping (WhatsApp-style).
 */
export function isGrouped(
  msg: Message,
  index: number,
  allMsgs: Message[],
): boolean {
  if (index === 0) return false;
  const prev = allMsgs[index - 1];
  
  // FIX: Bulletproof date parsing to prevent crashes on invalid timestamps
  const msgTime = new Date(msg.created_at || Date.now()).getTime();
  const prevTime = new Date(prev.created_at || Date.now()).getTime();
  
  return (
    prev.sender?.id === msg.sender?.id &&
    !prev.is_deleted &&
    !msg.reply_to &&
    !prev.reply_to &&
    !isNaN(msgTime) &&
    !isNaN(prevTime) &&
    msgTime - prevTime < 120000 // 2 minutes
  );
}
