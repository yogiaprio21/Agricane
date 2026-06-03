import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FieldsService } from './fields.service';
import {
  CreateFieldDto,
  FieldFilterDto,
  FieldResponseDto,
  UpdateFieldDto,
  UpdateGrowthStatusDto,
} from './dto/field.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Fields')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.AGRONOMIST, Role.MANAGER)
  @ApiOperation({ summary: 'Create new field' })
  @ApiResponse({ status: 201, description: 'Field created', type: FieldResponseDto })
  create(@Body() createFieldDto: CreateFieldDto) {
    return this.fieldsService.create(createFieldDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all fields' })
  @ApiResponse({ status: 200, description: 'Fields list', type: [FieldResponseDto] })
  @ApiQuery({ name: 'growthStatus', required: false })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  findAll(@Query() query: FieldFilterDto) {
    return this.fieldsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get field by ID with related data' })
  @ApiResponse({ status: 200, description: 'Field details', type: FieldResponseDto })
  @ApiResponse({ status: 404, description: 'Field not found' })
  findOne(@Param('id') id: string) {
    return this.fieldsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.AGRONOMIST, Role.MANAGER)
  @ApiOperation({ summary: 'Update field' })
  @ApiResponse({ status: 200, description: 'Field updated', type: FieldResponseDto })
  @ApiResponse({ status: 404, description: 'Field not found' })
  update(@Param('id') id: string, @Body() updateFieldDto: UpdateFieldDto) {
    return this.fieldsService.update(id, updateFieldDto);
  }

  @Patch(':id/growth-status')
  @Roles(Role.ADMIN, Role.AGRONOMIST)
  @ApiOperation({ summary: 'Update field growth status' })
  @ApiResponse({ status: 200, description: 'Growth status updated' })
  updateGrowthStatus(
    @Param('id') id: string,
    @Body() body: UpdateGrowthStatusDto,
  ) {
    return this.fieldsService.updateGrowthStatus(id, body.status);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete field (Admin only)' })
  @ApiResponse({ status: 200, description: 'Field deleted' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  remove(@Param('id') id: string) {
    return this.fieldsService.remove(id);
  }
}
