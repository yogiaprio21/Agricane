import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AiDecisionService } from './ai.decision.service';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('AI Decision Support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-decision')
export class AiDecisionController {
  constructor(private readonly aiDecisionService: AiDecisionService) {}

  @Get('prerequisites/:fieldId')
  @ApiOperation({ summary: 'Get data readiness before generating AI decisions' })
  @ApiParam({ name: 'fieldId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Decision prerequisites retrieved' })
  getPrerequisites(@Param('fieldId') fieldId: string) {
    return this.aiDecisionService.getDecisionPrerequisites(fieldId);
  }

  @Post('irrigation/:fieldId')
  @Roles(Role.ADMIN, Role.AGRONOMIST, Role.MANAGER)
  @ApiOperation({ summary: 'Generate irrigation decision for a field' })
  @ApiParam({ name: 'fieldId', type: 'string' })
  @ApiQuery({ name: 'demo', required: false, type: 'boolean', example: false })
  @ApiResponse({ status: 201, description: 'Irrigation decision generated' })
  @ApiResponse({ status: 422, description: 'Required source data is missing' })
  generateIrrigationDecision(
    @Param('fieldId') fieldId: string,
    @Query('demo', new DefaultValuePipe(false), ParseBoolPipe) demo: boolean,
  ) {
    return this.aiDecisionService.generateIrrigationDecision(fieldId, { demo });
  }

  @Post('harvest/:fieldId')
  @Roles(Role.ADMIN, Role.AGRONOMIST, Role.MANAGER)
  @ApiOperation({ summary: 'Generate harvest readiness decision for a field' })
  @ApiParam({ name: 'fieldId', type: 'string' })
  @ApiResponse({ status: 201, description: 'Harvest decision generated' })
  generateHarvestDecision(@Param('fieldId') fieldId: string) {
    return this.aiDecisionService.generateHarvestReadinessDecision(fieldId);
  }

  @Post('risk-assessment/:fieldId')
  @Roles(Role.ADMIN, Role.AGRONOMIST, Role.MANAGER)
  @ApiOperation({ summary: 'Generate risk assessment for a field' })
  @ApiParam({ name: 'fieldId', type: 'string' })
  @ApiResponse({ status: 201, description: 'Risk assessment generated' })
  generateRiskAssessment(@Param('fieldId') fieldId: string) {
    return this.aiDecisionService.generateRiskAssessment(fieldId);
  }

  @Get('history/:fieldId')
  @ApiOperation({ summary: 'Get decision history for a field' })
  @ApiParam({ name: 'fieldId', type: 'string' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', example: 20 })
  @ApiResponse({ status: 200, description: 'Decision history retrieved' })
  getHistory(
    @Param('fieldId') fieldId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.aiDecisionService.getDecisionHistory(fieldId, query);
  }

  @Get('by-type/:fieldId')
  @ApiOperation({ summary: 'Get decisions by type for a field' })
  @ApiParam({ name: 'fieldId', type: 'string' })
  @ApiQuery({ name: 'type', required: true, example: 'IRRIGATION' })
  @ApiResponse({ status: 200, description: 'Decisions retrieved' })
  getByType(
    @Param('fieldId') fieldId: string,
    @Query('type') type: string,
  ) {
    return this.aiDecisionService.getDecisionsByType(fieldId, type);
  }
}
