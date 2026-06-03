import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFieldDto, FieldFilterDto, UpdateFieldDto } from './dto/field.dto';
import { differenceInDays } from 'date-fns';
import { GrowthStatus } from '@prisma/client';
import {
  createPaginatedResponse,
  getPagination,
} from '../common/dto/pagination.dto';

@Injectable()
export class FieldsService {
  constructor(private prisma: PrismaService) {}

  async create(createFieldDto: CreateFieldDto) {
    const field = await this.prisma.field.create({
      data: {
        ...createFieldDto,
        growthStatus: createFieldDto.growthStatus || GrowthStatus.PLANTED,
      },
    });

    return this.enrichFieldWithCropAge(field);
  }

  async findAll(query?: FieldFilterDto) {
    const { page, limit, skip, sortOrder } = getPagination(query);
    const where = query?.growthStatus ? { growthStatus: query.growthStatus } : {};
    const [fields, total] = await Promise.all([
      this.prisma.field.findMany({
        where,
        orderBy: {
          createdAt: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.field.count({ where }),
    ]);

    return createPaginatedResponse(
      fields.map((field) => this.enrichFieldWithCropAge(field)),
      total,
      page,
      limit,
    );
  }

  async findAllLegacy() {
    const fields = await this.prisma.field.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return fields.map((field) => this.enrichFieldWithCropAge(field));
  }

  async findOne(id: string) {
    const field = await this.prisma.field.findUnique({
      where: { id },
      include: {
        sensorReadings: {
          take: 10,
          orderBy: {
            timestamp: 'desc',
          },
        },
        weatherData: {
          take: 5,
          orderBy: {
            recordedAt: 'desc',
          },
        },
        ndviData: {
          take: 5,
          orderBy: {
            captureDate: 'desc',
          },
        },
      },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${id} not found`);
    }

    return this.enrichFieldWithCropAge(field);
  }

  async update(id: string, updateFieldDto: UpdateFieldDto) {
    await this.findOne(id);

    const field = await this.prisma.field.update({
      where: { id },
      data: updateFieldDto,
    });

    return this.enrichFieldWithCropAge(field);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.field.delete({
      where: { id },
    });

    return { message: 'Field deleted successfully' };
  }

  async updateGrowthStatus(id: string, status: GrowthStatus) {
    const field = await this.prisma.field.update({
      where: { id },
      data: { growthStatus: status },
    });

    return this.enrichFieldWithCropAge(field);
  }

  private enrichFieldWithCropAge(field: any) {
    const cropAgeDays = differenceInDays(new Date(), new Date(field.plantingDate));
    
    return {
      ...field,
      cropAgeDays,
    };
  }

  async getFieldsForWeatherUpdate() {
    return this.prisma.field.findMany({
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
      },
    });
  }

  async getFieldsByGrowthStatus(status: GrowthStatus, query?: FieldFilterDto) {
    const { page, limit, skip, sortOrder } = getPagination(query);
    const fields = await this.prisma.field.findMany({
      where: {
        growthStatus: status,
      },
      orderBy: {
        createdAt: sortOrder,
      },
      skip,
      take: limit,
    });
    const total = await this.prisma.field.count({
      where: {
        growthStatus: status,
      },
    });

    return createPaginatedResponse(
      fields.map((field) => this.enrichFieldWithCropAge(field)),
      total,
      page,
      limit,
    );
  }
}
