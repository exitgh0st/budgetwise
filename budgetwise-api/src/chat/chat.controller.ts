import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private chatService: ChatService) {}

  // Send a message to the AI agent
  @Post()
  async sendMessage(@Body() dto: SendMessageDto) {
    try {
      const reply = await this.chatService.chat(dto.message, dto.sessionId);
      return { reply, sessionId: dto.sessionId };
    } catch (error: any) {
      this.logger.error('Chat error:', error.message);

      if (error.status === 401) {
        throw new InternalServerErrorException(
          'AI service authentication failed. Check your API key.',
        );
      }
      if (error.status === 429) {
        throw new InternalServerErrorException(
          'AI service rate limit reached. Please try again in a moment.',
        );
      }
      throw new InternalServerErrorException(
        'Failed to get a response from the AI advisor. Please try again.',
      );
    }
  }

  // Get chat history for a session
  @Get('history/:sessionId')
  async getHistory(
    @Param('sessionId') sessionId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.chatService.getHistory(
      sessionId,
      limit ? Number(limit) : 50,
      before,
    );
  }

  // List all conversation sessions
  @Get('sessions')
  async getSessions() {
    return this.chatService.getSessions();
  }

  // Get or create the active session (used when chat panel first opens)
  @Get('sessions/active')
  async getActiveSession() {
    const sessionId = await this.chatService.getOrCreateActiveSession();
    const { messages, hasMore } = await this.chatService.getHistory(sessionId);
    return { sessionId, messages, hasMore };
  }

  // Start a new conversation session
  @Post('sessions/new')
  async newSession(@Body() dto: CreateSessionDto) {
    return this.chatService.startNewSession(dto.title);
  }

  // Rename a session
  @Patch('sessions/:id')
  async updateSession(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
  ) {
    try {
      return await this.chatService.updateSession(id, dto.title);
    } catch {
      throw new NotFoundException(`Session ${id} not found`);
    }
  }

  // Delete a session and all its messages
  @Delete('sessions/:id')
  async deleteSession(@Param('id') id: string) {
    try {
      await this.chatService.deleteSession(id);
      return { deleted: true };
    } catch {
      throw new NotFoundException(`Session ${id} not found`);
    }
  }
}
