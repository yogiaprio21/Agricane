import React, { useEffect, useState } from 'react';
import { Layout } from '../components/common/Layout';
import { Badge, Button, DataList, EmptyState, InfoGrid, Input, Modal, PageHeader, SectionPanel, Spinner } from '../components/common';
import { agronomyService } from '../services/agronomy.service';
import { FAOReference, IrrigationRecommendation, SoilHealthAssessment } from '../types';
import { BookOpen, Droplets, Activity, ExternalLink, Leaf } from 'lucide-react';
import { toast } from 'react-hot-toast';

const formatKey = (key: string) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

const formatValue = (value: any): string => {
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([key, nestedValue]) => `${formatKey(key)}: ${formatValue(nestedValue)}`)
      .join(' - ');
  }
  return String(value ?? '-');
};

const getContentEntries = (content: any) => {
  if (!content) return [];
  if (typeof content === 'string') {
    return [['Summary', content]];
  }
  return Object.entries(content);
};

export const Agronomy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'references' | 'calculator'>('references');
  const [references, setReferences] = useState<FAOReference[]>([]);
  const [sugarcaneGuidelines, setSugarcaneGuidelines] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReference, setSelectedReference] = useState<FAOReference | null>(null);

  // Calculator State
  const [calcType, setCalcType] = useState<'irrigation' | 'soil'>('irrigation');
  const [irrigationParams, setIrrigationParams] = useState({
    soilMoisture: 30,
    temperature: 28,
    cropAge: 90,
  });
  const [soilParams, setSoilParams] = useState({
    soilPH: 6.5,
    organicMatter: 2.0,
  });
  const [irrigationResult, setIrrigationResult] = useState<IrrigationRecommendation | null>(null);
  const [soilResult, setSoilResult] = useState<SoilHealthAssessment | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [refs, guidelines] = await Promise.all([
        agronomyService.getAllFAOReferences().catch(() => []),
        agronomyService.getSugarcaneGuidelines().catch(() => null),
      ]);
      setReferences(refs);
      setSugarcaneGuidelines(guidelines);
    } catch (error) {
      console.error('Failed to load agronomy data:', error);
      toast.error('Failed to load agronomy data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculateIrrigation = async () => {
    try {
      setIsCalculating(true);
      const result = await agronomyService.getIrrigationRecommendations(
        irrigationParams.soilMoisture,
        irrigationParams.temperature,
        irrigationParams.cropAge
      );
      setIrrigationResult(result);
    } catch (error) {
      toast.error('Failed to calculate irrigation');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculateSoil = async () => {
    try {
      setIsCalculating(true);
      const result = await agronomyService.getSoilHealthAssessment(
        soilParams.soilPH,
        soilParams.organicMatter
      );
      setSoilResult(result);
    } catch (error) {
      toast.error('Failed to assess soil health');
    } finally {
      setIsCalculating(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Agronomy Knowledge Base"
        description="FAO references, guidelines, and agronomic calculators"
      />

      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200">
        <button
          className={`flex min-h-10 items-center gap-2 rounded-t-md px-4 pb-2 pt-2 text-sm font-semibold ${
            activeTab === 'references'
              ? 'border-b-2 border-primary-600 text-primary-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('references')}
        >
          <BookOpen size={18} />
          References & Guidelines
        </button>
        <button
          className={`flex min-h-10 items-center gap-2 rounded-t-md px-4 pb-2 pt-2 text-sm font-semibold ${
            activeTab === 'calculator'
              ? 'border-b-2 border-primary-600 text-primary-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('calculator')}
        >
          <Activity size={18} />
          Agronomic Calculators
        </button>
      </div>

      {activeTab === 'references' && (
        <div className="space-y-6">
          {sugarcaneGuidelines && (
            <SectionPanel title="Sugarcane Cultivation Guidelines" subtitle="Structured reference ranges for irrigation, soil, climate, and pest management">
              <div className="flex flex-col gap-4">
                <div className="flex items-start">
                <Leaf className="text-green-600 mr-3 mt-1" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Operational ranges</h3>
                  <p className="text-sm text-gray-600">Use these references as context for calculator and AI recommendation output.</p>
                </div>
              </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {Object.entries(sugarcaneGuidelines).map(([section, content]) => (
                    <div key={section} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h4 className="mb-3 text-sm font-semibold uppercase text-gray-700">
                        {formatKey(section)}
                      </h4>
                      <div className="space-y-2">
                        {getContentEntries(content).map(([key, value]) => (
                          <div key={String(key)} className="grid grid-cols-[7rem_1fr] gap-3 text-sm">
                            <span className="text-gray-500">{formatKey(String(key))}</span>
                            <span className="font-medium text-gray-900">{formatValue(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionPanel>
          )}

          {references.length > 0 && (
            <SectionPanel title="Reference Library" subtitle="Seeded agronomy records organized as concise field-ready notes">
              <DataList
                items={references.map((ref) => ({
                  id: ref.id,
                  title: ref.subcategory,
                  badge: <Badge variant="info">{ref.category}</Badge>,
                  subtitle: (
                    <span>
                      {formatKey(ref.dataType)} · Updated {new Date(ref.lastFetchedAt).toLocaleDateString()}
                    </span>
                  ),
                  meta: (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {getContentEntries(ref.content).slice(0, 4).map(([key, value]) => (
                        <span key={String(key)} className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                          <span className="font-semibold">{formatKey(String(key))}: </span>
                          {formatValue(value)}
                        </span>
                      ))}
                    </div>
                  ),
                  actions: (
                    <Button variant="outline" size="sm" onClick={() => setSelectedReference(ref)} rightIcon={<ExternalLink size={14} />}>
                      Read More
                    </Button>
                  ),
                }))}
              />
            </SectionPanel>
          )}
          
          {references.length === 0 && !sugarcaneGuidelines && (
            <EmptyState
              icon={<BookOpen size={42} />}
              title="No references available"
              description="FAO data has not been fetched or seeded yet."
            />
          )}
        </div>
      )}

      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <SectionPanel title="Tools" className="pt-0">
            <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
              <button
                onClick={() => { setCalcType('irrigation'); setIrrigationResult(null); }}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left ${calcType === 'irrigation' ? 'bg-primary-50 text-primary-800' : 'hover:bg-gray-50'}`}
              >
                <Droplets size={20} className="mt-0.5 shrink-0" />
                <span>
                  <span className="block font-semibold">Irrigation Calculator</span>
                  <span className="block text-xs text-gray-500">Water needs by soil and crop age</span>
                </span>
              </button>
              <button
                onClick={() => { setCalcType('soil'); setSoilResult(null); }}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left ${calcType === 'soil' ? 'bg-primary-50 text-primary-800' : 'hover:bg-gray-50'}`}
              >
                <Activity size={20} className="mt-0.5 shrink-0" />
                <span>
                  <span className="block font-semibold">Soil Health Assessor</span>
                  <span className="block text-xs text-gray-500">pH and organic matter check</span>
                </span>
              </button>
            </div>
          </SectionPanel>

          <SectionPanel
            title={calcType === 'irrigation' ? 'Irrigation Recommendation' : 'Soil Health Assessment'}
            subtitle={calcType === 'irrigation' ? 'Estimate water requirement from current field conditions' : 'Assess soil suitability from pH and organic matter'}
            className="pt-0"
          >
            {calcType === 'irrigation' ? (
              <div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Input
                    label="Soil Moisture (%)"
                    type="number"
                    value={irrigationParams.soilMoisture.toString()}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setIrrigationParams({
                        ...irrigationParams,
                        soilMoisture: Number.isNaN(value) ? 0 : value,
                      });
                    }}
                    className="mb-0"
                  />
                  <Input
                    label="Temperature (°C)"
                    type="number"
                    value={irrigationParams.temperature.toString()}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setIrrigationParams({
                        ...irrigationParams,
                        temperature: Number.isNaN(value) ? 0 : value,
                      });
                    }}
                    className="mb-0"
                  />
                  <Input
                    label="Crop Age (Days)"
                    type="number"
                    value={irrigationParams.cropAge.toString()}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setIrrigationParams({
                        ...irrigationParams,
                        cropAge: Number.isNaN(value) ? 0 : value,
                      });
                    }}
                    className="mb-0"
                  />
                </div>

                <div className="mt-4 flex justify-end">
                  <Button onClick={handleCalculateIrrigation} disabled={isCalculating} isLoading={isCalculating}>
                    Calculate Requirement
                  </Button>
                </div>

                {irrigationResult && (
                  <div className={`mt-5 rounded-lg border p-4 ${
                    irrigationResult.urgency === 'HIGH' || irrigationResult.status === 'critical' ? 'border-red-200 bg-red-50' :
                    irrigationResult.urgency === 'MEDIUM' || irrigationResult.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-green-200 bg-green-50'
                  }`}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-gray-950">Result</h3>
                      <Badge variant={
                        irrigationResult.urgency === 'HIGH' || irrigationResult.status === 'critical' ? 'danger' :
                        irrigationResult.urgency === 'MEDIUM' || irrigationResult.status === 'warning' ? 'warning' : 'success'
                      }>
                        {(irrigationResult.urgency || irrigationResult.status || 'optimal').toUpperCase()}
                      </Badge>
                    </div>
                    <InfoGrid
                      className="mb-3 sm:grid-cols-2 lg:grid-cols-2"
                      items={[
                        {
                          label: 'Current',
                          value: irrigationResult.currentMoisture !== undefined ? `${irrigationResult.currentMoisture}%` : irrigationResult.waterNeededMm ? `${irrigationResult.waterNeededMm} mm` : '-',
                          helper: irrigationResult.currentMoisture !== undefined ? 'Current soil moisture' : 'Estimated water need',
                        },
                        {
                          label: 'Target',
                          value: irrigationResult.targetMoisture !== undefined ? `${irrigationResult.targetMoisture}%` : irrigationResult.nextIrrigationDue ? new Date(irrigationResult.nextIrrigationDue).toLocaleDateString() : '-',
                          helper: irrigationResult.targetMoisture !== undefined ? 'Target soil moisture' : 'Next irrigation due',
                        },
                      ]}
                    />
                    <p className="text-sm text-gray-800">{irrigationResult.recommendation}</p>
                    {(irrigationResult.reasoning || irrigationResult.faoReference) && (
                      <p className="mt-2 text-sm text-gray-600">{irrigationResult.reasoning || formatValue(irrigationResult.faoReference)}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label="Soil pH (0-14)"
                    type="number"
                    step="0.1"
                    value={soilParams.soilPH.toString()}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setSoilParams({ ...soilParams, soilPH: Number.isNaN(value) ? 0 : value });
                    }}
                    className="mb-0"
                  />
                  <Input
                    label="Organic Matter (%)"
                    type="number"
                    step="0.1"
                    value={soilParams.organicMatter.toString()}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setSoilParams({ ...soilParams, organicMatter: Number.isNaN(value) ? 0 : value });
                    }}
                    className="mb-0"
                  />
                </div>

                <div className="mt-4 flex justify-end">
                  <Button onClick={handleCalculateSoil} disabled={isCalculating} isLoading={isCalculating}>
                    Assess Soil
                  </Button>
                </div>

                {soilResult && (
                  <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-gray-950">pH Status</h3>
                      <Badge variant={(soilResult.phStatus || soilResult.status)?.toUpperCase() === 'OPTIMAL' ? 'success' : 'warning'}>
                        {(soilResult.phStatus || soilResult.status || 'unknown').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-800">{soilResult.recommendation || soilResult.assessment}</p>
                    {soilResult.optimalRange && (
                      <p className="mt-2 text-sm text-gray-600">
                        Optimal pH range: {soilResult.optimalRange.min}-{soilResult.optimalRange.max}
                      </p>
                    )}
                    <div className="mt-3 rounded-md bg-white p-3 text-sm text-gray-700">
                      {formatValue(soilResult.faoReference || soilResult.suitableCrops || 'Sugarcane')}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionPanel>
        </div>
      )}

      <Modal
        isOpen={!!selectedReference}
        onClose={() => setSelectedReference(null)}
        title={selectedReference ? `${formatKey(selectedReference.category)} Reference` : 'Reference'}
      >
        {selectedReference && (
          <div className="space-y-4">
            <InfoGrid
              className="sm:grid-cols-3"
              items={[
                { label: 'Subcategory', value: selectedReference.subcategory },
                { label: 'Data Type', value: formatKey(selectedReference.dataType) },
                { label: 'Updated', value: new Date(selectedReference.lastFetchedAt).toLocaleDateString() },
              ]}
            />
            <DataList
              items={getContentEntries(selectedReference.content).map(([key, value]) => ({
                id: String(key),
                title: formatKey(String(key)),
                subtitle: formatValue(value),
              }))}
            />
          </div>
        )}
      </Modal>
    </Layout>
  );
};
