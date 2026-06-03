import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class AgronomyService {
  private readonly logger = new Logger(AgronomyService.name);
  private readonly faoBaseUrl: string;
  private axiosInstance: AxiosInstance;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTTL = 86400000;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.faoBaseUrl = this.configService.get<string>('fao.baseUrl');
    this.axiosInstance = axios.create({
      baseURL: this.faoBaseUrl,
      timeout: 5000,
    });
  }

  private parseReferenceContent(content: string | null, cacheKey: string) {
    if (!content || content === 'null') {
      this.logger.warn(`Invalid empty FAO reference content for ${cacheKey}. Falling back to defaults.`);
      const [category, subcategory, dataType] = cacheKey.split(':');
      return this.getFallbackData(category, subcategory, dataType) || {};
    }

    try {
      return JSON.parse(content);
    } catch (error) {
      this.logger.warn(
        `Invalid FAO reference JSON for ${cacheKey}: ${error instanceof Error ? error.message : 'unknown parse error'}`,
      );
      const [category, subcategory, dataType] = cacheKey.split(':');
      return this.getFallbackData(category, subcategory, dataType) || {};
    }
  }

  async getFAOReference(category: string, subcategory: string, dataType: string) {
    const cacheKey = `${category}:${subcategory}:${dataType}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      this.logger.log(`Using cached FAO reference: ${cacheKey}`);
      return cached.data;
    }

    const dbRef = await this.prisma.fAOReference.findUnique({
      where: {
        category_subcategory_dataType: {
          category,
          subcategory,
          dataType,
        },
      },
    });

    if (dbRef) {
      const parsed = {
        ...dbRef,
        content: this.parseReferenceContent(dbRef.content, cacheKey),
      };
      this.cache.set(cacheKey, { data: parsed, timestamp: Date.now() });
      return parsed;
    }

    // If not in DB, try External API
    try {
      this.logger.log(`Fetching FAO data from external API for ${cacheKey}`);
      const apiData = await this.fetchFAODataFromAPI(category, subcategory, dataType);
      
      if (apiData) {
        // Save to DB
        const saved = await this.saveFAOReference(category, subcategory, dataType, apiData, { source: 'external_api' });
        
        const parsed = {
          ...saved,
          content: apiData,
        };
        this.cache.set(cacheKey, { data: parsed, timestamp: Date.now() });
        return parsed;
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch from FAO API: ${error.message}. Using fallback defaults.`);
    }

    // Fallback defaults if API fails and DB empty
    const fallback = this.getFallbackData(category, subcategory, dataType);
    if (fallback) {
      // Optionally save fallback to DB to avoid repeated API calls? 
      // Maybe not, keep it in memory or let it retry API next time.
      return { content: fallback };
    }

    return null;
  }

  private async fetchFAODataFromAPI(category: string, subcategory: string, dataType: string) {
    // Mocking the endpoint structure since specific FAO API details are generic
    try {
      const response = await this.axiosInstance.get('/guidelines', {
        params: { category, subcategory, type: dataType }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  private getFallbackData(category: string, subcategory: string, dataType: string) {
    // Critical defaults for Sugarcane
    if (subcategory === 'sugarcane') {
      if (category === 'irrigation' && dataType === 'water_requirement') {
        return { waterRequirement: '1500-2500mm per cycle', cropCoefficient: 1.05, efficiency: 0.75 };
      }
      if (category === 'climate' && dataType === 'optimal_range') {
        return { tempMin: 20, tempMax: 35, rainfall: '1500mm' };
      }
      if (category === 'pest_management' && dataType === 'integrated_approach') {
        return { method: 'biological_control', agents: ['Trichogramma'] };
      }
    }
    if (category === 'soil' && subcategory === 'optimal_conditions' && dataType === 'sugarcane_soil') {
      return { optimalPH: { min: 6.0, max: 7.5 }, texture: 'loam' };
    }
    return null;
  }

  async getAllFAOReferences() {
    const references = await this.prisma.fAOReference.findMany({
      orderBy: {
        lastFetchedAt: 'desc',
      },
    });

    return references.map((ref) => ({
      ...ref,
      content: this.parseReferenceContent(ref.content, `${ref.category}:${ref.subcategory}:${ref.dataType}`),
    }));
  }

  async saveFAOReference(
    category: string,
    subcategory: string,
    dataType: string,
    content: any,
    metadata?: any,
  ) {
    const existing = await this.prisma.fAOReference.findUnique({
      where: {
        category_subcategory_dataType: {
          category,
          subcategory,
          dataType,
        },
      },
    });

    const contentStr = JSON.stringify(content);

    if (existing) {
      return this.prisma.fAOReference.update({
        where: { id: existing.id },
        data: {
          content: contentStr,
          metadata,
          lastFetchedAt: new Date(),
        },
      });
    }

    return this.prisma.fAOReference.create({
      data: {
        category,
        subcategory,
        dataType,
        content: contentStr,
        metadata,
      },
    });
  }

  async getSugarcaneGuidelines() {
    const irrigation = await this.getFAOReference('irrigation', 'sugarcane', 'water_requirement');
    const soil = await this.getFAOReference('soil', 'optimal_conditions', 'sugarcane_soil');
    const climate = await this.getFAOReference('climate', 'sugarcane', 'optimal_range');
    const pest = await this.getFAOReference('pest_management', 'sugarcane', 'integrated_approach');

    return {
      irrigation: irrigation?.content || null,
      soil: soil?.content || null,
      climate: climate?.content || null,
      pestManagement: pest?.content || null,
    };
  }

  async getOptimalConditions(crop: string = 'sugarcane') {
    const climate = await this.getFAOReference('climate', crop, 'optimal_range');
    const soil = await this.getFAOReference('soil', 'optimal_conditions', `${crop}_soil`);
    const irrigation = await this.getFAOReference('irrigation', crop, 'water_requirement');

    if (!climate || !soil || !irrigation) {
      this.logger.warn(`Incomplete optimal conditions data for ${crop}`);
    }

    return {
      crop,
      climate: climate?.content || {},
      soil: soil?.content || {},
      irrigation: irrigation?.content || {},
      lastUpdated: new Date(),
    };
  }

  async getIrrigationRecommendations(
    currentSoilMoisture: number,
    temperature: number,
    cropAge: number,
  ) {
    const irrigation = await this.getFAOReference('irrigation', 'sugarcane', 'water_requirement');
    
    if (!irrigation) {
      return {
        recommendation: 'FAO reference data not available',
        status: 'unknown',
      };
    }

    const irrigationData = irrigation.content;
    const optimalMoisture = 60;

    let recommendation = '';
    let status = 'normal';

    if (currentSoilMoisture < 40) {
      recommendation = `Immediate irrigation required. Current soil moisture (${currentSoilMoisture}%) is below critical threshold. FAO recommends maintaining ${irrigationData.waterRequirement || '1500-2500mm per cycle'} for sugarcane.`;
      status = 'critical';
    } else if (currentSoilMoisture < 50) {
      recommendation = `Schedule irrigation within 24 hours. Soil moisture is at ${currentSoilMoisture}%. Crop coefficient for sugarcane is ${irrigationData.cropCoefficient || 1.05}.`;
      status = 'warning';
    } else if (currentSoilMoisture > 80) {
      recommendation = `Reduce irrigation. Soil moisture is high at ${currentSoilMoisture}%. Risk of waterlogging. Ensure proper drainage as per FAO guidelines.`;
      status = 'excess';
    } else {
      recommendation = `Soil moisture optimal at ${currentSoilMoisture}%. Maintain current irrigation schedule. Efficiency factor: ${irrigationData.efficiency || 0.75}.`;
      status = 'optimal';
    }

    return {
      recommendation,
      status,
      currentMoisture: currentSoilMoisture,
      targetMoisture: optimalMoisture,
      faoReference: irrigationData,
      temperature,
      cropAge,
    };
  }

  async getSoilHealthAssessment(soilPH: number, organicMatter?: number) {
    const soilRef = await this.getFAOReference('soil', 'optimal_conditions', 'sugarcane_soil');
    
    if (!soilRef) {
      return {
        assessment: 'FAO soil reference data not available',
        status: 'unknown',
      };
    }

    const optimal = soilRef.content.optimalPH || { min: 6.0, max: 7.5 };
    let assessment = '';
    let status = 'normal';

    if (soilPH < optimal.min) {
      assessment = `Soil is acidic (pH ${soilPH}). FAO optimal range: ${optimal.min}-${optimal.max}. Consider lime application to raise pH.`;
      status = 'acidic';
    } else if (soilPH > optimal.max) {
      assessment = `Soil is alkaline (pH ${soilPH}). FAO optimal range: ${optimal.min}-${optimal.max}. Consider sulfur application to lower pH.`;
      status = 'alkaline';
    } else {
      assessment = `Soil pH is optimal at ${soilPH}. Within FAO recommended range: ${optimal.min}-${optimal.max}.`;
      status = 'optimal';
    }

    return {
      assessment,
      status,
      currentPH: soilPH,
      optimalRange: optimal,
      faoReference: soilRef.content,
      organicMatter,
    };
  }
}
