import axios from 'axios';
import type { ChatbotRequest, ChatbotResponse } from '@/types/chatbot';

const CHATBOT_API_URL = '/api/chatbot-proxy';

// .env에 아래와 같이 추가하세요:
// OPENSEARCH_USERNAME=admin
// OPENSEARCH_PASSWORD=비밀번호

export async function sendChatbotMessage(req: ChatbotRequest) {
  const username = process.env.OPENSEARCH_USERNAME;
  const password = process.env.OPENSEARCH_PASSWORD;
  const basicAuth = username && password
    ? 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
    : undefined;

  const response = await axios.post<ChatbotResponse>('/api/chatbot-proxy', req, {
    headers: {
      'Content-Type': 'application/json',
      ...(basicAuth ? { Authorization: basicAuth } : {}),
    },
    withCredentials: false,
    // Do not throw on non-2xx; we will inspect the body and proceed if usable
    validateStatus: () => true,
  });
  return response.data;
}
