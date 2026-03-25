export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolName?: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
