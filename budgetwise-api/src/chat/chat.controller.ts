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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private chatService: ChatService) {}

  // Send a message to the AI agent
  @Post()
  async sendMessage(
    @CurrentUser() user: { userId: string },
    @Body() dto: SendMessageDto,
  ) {
    try {
      const reply = await this.chatService.chat(dto.message, dto.sessionId, user.userId);
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
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to get a response from the AI advisor. Please try again.',
      );
    }
  }

  // Get chat history for a session
  @Get('history/:sessionId')
  async getHistory(
    @CurrentUser() user: { userId: string },
    @Param('sessionId') sessionId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.chatService.getHistory(
      sessionId,
      limit ? Number(limit) : 50,
      before,
      user.userId,
    );
  }

  // List all conversation sessions
  @Get('sessions')
  async getSessions(@CurrentUser() user: { userId: string }) {
    return this.chatService.getSessions(user.userId);
  }

  // Get or create the active session (used when chat panel first opens)
  @Get('sessions/active')
  async getActiveSession(@CurrentUser() user: { userId: string }) {
    const sessionId = await this.chatService.getOrCreateActiveSession(user.userId);
    const { messages, hasMore } = await this.chatService.getHistory(sessionId, 50, undefined, user.userId);
    return { sessionId, messages, hasMore };
  }

  // Start a new conversation session
  @Post('sessions/new')
  async newSession(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateSessionDto,
  ) {
    return this.chatService.startNewSession(dto.title, user.userId);
  }

  // Rename a session
  @Patch('sessions/:id')
  async updateSession(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
  ) {
    try {
      return await this.chatService.updateSession(id, dto.title, user.userId);
    } catch {
      throw new NotFoundException(`Session ${id} not found`);
    }
  }

  // Delete a session and all its messages
  @Delete('sessions/:id')
  async deleteSession(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    try {
      await this.chatService.deleteSession(id, user.userId);
      return { deleted: true };
    } catch {
      throw new NotFoundException(`Session ${id} not found`);
    }
  }
}
