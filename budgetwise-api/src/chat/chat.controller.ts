import { Controller, Get } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  // Temporary test endpoint — verify DeepSeek API connection
  @Get('test')
  async testConnection() {
    const response = await this.chatService.testConnection();
    return { message: response };
  }
}
