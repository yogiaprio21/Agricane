import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { NotificationPriority, NotificationType, Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreateNotificationDto {
  @ApiProperty({ required: false, example: '78e9399a-0185-43ee-8592-e4f392feaa8a' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ enum: NotificationPriority })
  @IsEnum(NotificationPriority)
  priority: NotificationPriority;

  @ApiProperty({ example: 'Sensor Anomaly - North Block A1' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Low soil moisture detected.' })
  @IsString()
  message: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  metadata?: Prisma.InputJsonValue;
}

export class NotificationFilterDto extends PaginationQueryDto {
  @ApiProperty({ required: false, type: 'boolean' })
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  unreadOnly?: boolean;

  @ApiProperty({ enum: NotificationType, required: false })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiProperty({ enum: NotificationPriority, required: false })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;
}
