import { apiRequest } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  suggestions: string[];
}

export async function sendMessage(
  message: string,
  history: ChatMessage[],
  campaignContext?: string,
): Promise<ChatResponse> {
  return apiRequest<ChatResponse>('/api/v1/agent/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      history,
      campaign_context: campaignContext,
    }),
  });
}
