import { Injectable } from '@nestjs/common';

// ToolExecutor will be fully implemented in Ticket 16
@Injectable()
export class ToolExecutor {
  async execute(toolName: string, args: Record<string, any>): Promise<any> {
    return { error: `Tool '${toolName}' not yet implemented` };
  }
}
