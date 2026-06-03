import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseEnumPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorators';
import { CreateNotificationDto, NotificationFilterDto } from './dto/notification.dto';
import { NotificationPriority, NotificationType } from '@prisma/client';
import { Role } from '../common/enums/role.enum';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create notification (system use)' })
  @ApiResponse({ status: 201, description: 'Notification created' })
  create(
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: 'boolean' })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'priority', required: false, enum: NotificationPriority })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  findAll(
    @CurrentUser() user: any,
    @Query() query: NotificationFilterDto,
  ) {
    return this.notificationsService.findAll(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved' })
  getUnreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Get('by-type/:type')
  @ApiOperation({ summary: 'Get notifications by type' })
  @ApiParam({ name: 'type', type: 'string', example: 'WEATHER_ALERT' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  getByType(@Param('type', new ParseEnumPipe(NotificationType)) type: NotificationType) {
    return this.notificationsService.getNotificationsByType(type);
  }

  @Get('by-priority/:priority')
  @ApiOperation({ summary: 'Get notifications by priority' })
  @ApiParam({ name: 'priority', type: 'string', example: 'HIGH' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  getByPriority(
    @Param('priority', new ParseEnumPipe(NotificationPriority)) priority: NotificationPriority,
  ) {
    return this.notificationsService.getNotificationsByPriority(priority);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Notification retrieved' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.findOne(id, user.id);
  }

  @Patch(':id/read')
  @Roles(Role.ADMIN, Role.AGRONOMIST, Role.DRONE_OPERATOR, Role.TECHNICIAN, Role.MANAGER)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('mark-all-read')
  @Roles(Role.ADMIN, Role.AGRONOMIST, Role.DRONE_OPERATOR, Role.TECHNICIAN, Role.MANAGER)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.AGRONOMIST, Role.DRONE_OPERATOR, Role.TECHNICIAN, Role.MANAGER)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.delete(id, user.id);
  }
}
