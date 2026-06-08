import { Controller, Get, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ResiGroupService } from './resigroup.service';
import { ResiAdminGuard } from './resi-admin.guard';

@Controller('resi/ai')
export class ResiAiController {
  constructor(private service: ResiGroupService) {}

  // ── Public: bot logs a question it couldn't answer ──────────
  @Post('log')
  @HttpCode(HttpStatus.OK)
  async log(@Body('question') question: string) {
    return this.service.logUnansweredQuestion(question);
  }

  // ── Public: bot fetches the learned knowledge base ──────────
  @Get('knowledge')
  async knowledge() {
    return this.service.getAiKnowledge();
  }

  // ── Admin: review frequent unanswered questions ─────────────
  @Get('unanswered')
  @UseGuards(ResiAdminGuard)
  async unanswered() {
    return this.service.getUnansweredQuestions();
  }

  @Delete('unanswered/:id')
  @UseGuards(ResiAdminGuard)
  async dismiss(@Param('id') id: string) {
    return this.service.dismissUnansweredQuestion(id);
  }

  // ── Admin: teach the assistant a new answer ─────────────────
  @Post('teach')
  @UseGuards(ResiAdminGuard)
  async teach(@Body() body: { keywords: string; answer: string; unansweredId?: string }) {
    if (!body.keywords || !body.answer) {
      return { success: false, message: 'Mots-clés et réponse sont requis' };
    }
    try {
      const created = await this.service.teachAiAnswer(body.keywords, body.answer, body.unansweredId);
      return { success: true, knowledge: created };
    } catch (e) {
      return { success: false, message: e.message || 'Erreur lors de l\'enregistrement' };
    }
  }

  @Delete('knowledge/:id')
  @UseGuards(ResiAdminGuard)
  async deleteKnowledge(@Param('id') id: string) {
    return this.service.deleteAiKnowledge(id);
  }
}
