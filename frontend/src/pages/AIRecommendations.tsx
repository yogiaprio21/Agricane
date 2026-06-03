import React, { useEffect, useState } from 'react';
import { Layout } from '../components/common/Layout';
import { ActionToolbar, Alert, Badge, Button, EmptyState, PageHeader, PaginationControls, Select, Spinner } from '../components/common';
import { fieldService } from '../services/field.service';
import { aiService } from '../services/ai.service';
import { Field, AIDecision, AIDecisionPrerequisites, PaginationMeta, Role } from '../types';
import { Droplets, Calendar, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';

export const AIRecommendations: React.FC = () => {
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [irrigationDecision, setIrrigationDecision] = useState<AIDecision | null>(null);
  const [harvestDecision, setHarvestDecision] = useState<AIDecision | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<AIDecision | null>(null);
  const [decisionHistory, setDecisionHistory] = useState<AIDecision[]>([]);
  const [historyMeta, setHistoryMeta] = useState<PaginationMeta | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [prerequisites, setPrerequisites] = useState<AIDecisionPrerequisites | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFields();
  }, []);

  useEffect(() => {
    if (selectedFieldId) {
      loadDecisions();
    }
  }, [selectedFieldId, historyPage]);

  useEffect(() => {
    setHistoryPage(1);
  }, [selectedFieldId]);

  const loadFields = async () => {
    try {
      const data = await fieldService.getAll();
      setFields(data);
      if (data.length > 0) {
        setSelectedFieldId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load fields:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDecisions = async () => {
    try {
      const [prereq, irrigation, harvest, risk, history] = await Promise.all([
        aiService.getPrerequisites(selectedFieldId).catch(() => null),
        aiService.getByType(selectedFieldId, 'IRRIGATION').then(d => d[0] || null).catch(() => null),
        aiService.getByType(selectedFieldId, 'HARVEST_READINESS').then(d => d[0] || null).catch(() => null),
        aiService.getByType(selectedFieldId, 'RISK_ASSESSMENT').then(d => d[0] || null).catch(() => null),
        aiService.getHistoryPage(selectedFieldId, historyPage, 8).catch(() => null),
      ]);
      setPrerequisites(prereq);
      setIrrigationDecision(irrigation);
      setHarvestDecision(harvest);
      setRiskAssessment(risk);
      setDecisionHistory(history?.data || []);
      setHistoryMeta(history?.meta || null);
    } catch (error) {
      console.error('Failed to load decisions:', error);
    }
  };

  const generateDecision = async (type: 'irrigation' | 'harvest' | 'risk') => {
    setError('');
    setIsGenerating(type);
    try {
      let decision: AIDecision;
      if (type === 'irrigation') {
        decision = await aiService.generateIrrigationDecision(selectedFieldId, demoMode);
        setIrrigationDecision(decision);
      } else if (type === 'harvest') {
        decision = await aiService.generateHarvestDecision(selectedFieldId);
        setHarvestDecision(decision);
      } else {
        decision = await aiService.generateRiskAssessment(selectedFieldId);
        setRiskAssessment(decision);
      }
      await loadDecisions();
    } catch (error: any) {
      console.error('Failed to generate decision:', error);
      const responseMessage = error.response?.data?.message;
      const missingData = error.response?.data?.missingData;
      setError(
        Array.isArray(missingData)
          ? `${responseMessage}: ${missingData.join(', ')}`
          : responseMessage || 'Failed to generate decision',
      );
    } finally {
      setIsGenerating(null);
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

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation.includes('IMMEDIATE') || recommendation.includes('CRITICAL')) return 'danger';
    if (recommendation.includes('READY') || recommendation.includes('OPTIMAL')) return 'success';
    if (recommendation.includes('SCHEDULE') || recommendation.includes('MONITOR')) return 'warning';
    return 'info';
  };
  const isReadOnly = user?.role === Role.VIEWER;

  const formatDecisionDate = (value: string) => format(new Date(value), 'MMM dd, yyyy HH:mm');

  const FactorTile = ({ label, value, tone = 'gray' }: { label: string; value: string; tone?: 'orange' | 'blue' | 'cyan' | 'green' | 'purple' | 'gray' }) => {
    const tones = {
      orange: 'bg-orange-50 text-orange-900',
      blue: 'bg-blue-50 text-blue-900',
      cyan: 'bg-cyan-50 text-cyan-900',
      green: 'bg-green-50 text-green-900',
      purple: 'bg-purple-50 text-purple-900',
      gray: 'bg-gray-50 text-gray-900',
    };

    return (
      <div className={`rounded-md px-3 py-2 ${tones[tone]}`}>
        <p className="text-[11px] font-medium uppercase text-gray-500">{label}</p>
        <p className="mt-0.5 text-sm font-bold">{value}</p>
      </div>
    );
  };

  const DecisionPanel = ({
    title, 
    icon: Icon, 
    decision, 
    isGenerating: generating, 
    onGenerate,
    disabled,
    helper,
  }: {
    title: string; 
    icon: React.ElementType;
    decision: AIDecision | null; 
    isGenerating: boolean; 
    onGenerate: () => void;
    disabled?: boolean;
    helper?: string;
  }) => (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700">
            <Icon size={19} />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold leading-tight text-gray-950">{title}</h3>
            {decision && (
              <p className="mt-1 text-xs text-gray-500">
                Confidence {(decision.confidence * 100).toFixed(0)}% · {formatDecisionDate(decision.createdAt)}
              </p>
            )}
          </div>
        </div>
        <Button onClick={onGenerate} disabled={generating || disabled} variant="outline" size="sm">
          <RefreshCw size={15} className={generating ? 'animate-spin' : ''} />
          Generate
        </Button>
      </div>
      {helper && <p className="mb-4 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">{helper}</p>}

      {decision ? (
        <div className="space-y-4">
          <div>
            <Badge variant={getRecommendationColor(decision.recommendation) as any}>
              {decision.recommendation.replace(/_/g, ' ')}
            </Badge>
          </div>

          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-sm text-gray-800 leading-relaxed">{decision.explanation}</p>
          </div>

          {decision.weatherFactors && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Weather factors</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(decision.weatherFactors.temperature ?? decision.weatherFactors.avgTemperature) !== undefined && (
                  <FactorTile
                    label={decision.weatherFactors.avgTemperature !== undefined ? 'Avg temp' : 'Temp'}
                    value={`${(decision.weatherFactors.temperature ?? decision.weatherFactors.avgTemperature).toFixed(1)}°C`}
                    tone="orange"
                  />
                )}
                {decision.weatherFactors.humidity !== undefined && (
                  <FactorTile label="Humidity" value={`${decision.weatherFactors.humidity.toFixed(1)}%`} tone="blue" />
                )}
                {(decision.weatherFactors.rainfall ?? decision.weatherFactors.totalRainfall) !== undefined && (
                  <FactorTile
                    label={decision.weatherFactors.totalRainfall !== undefined ? 'Total rain' : 'Rainfall'}
                    value={`${(decision.weatherFactors.rainfall ?? decision.weatherFactors.totalRainfall).toFixed(1)} mm`}
                    tone="cyan"
                  />
                )}
              </div>
            </div>
          )}

          {decision.soilFactors && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Soil factors</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(decision.soilFactors.moisture ?? decision.soilFactors.avgMoisture) !== undefined && (
                  <FactorTile
                    label={decision.soilFactors.avgMoisture !== undefined ? 'Avg moisture' : 'Moisture'}
                    value={`${(decision.soilFactors.moisture ?? decision.soilFactors.avgMoisture).toFixed(1)}%`}
                    tone="green"
                  />
                )}
                {decision.soilFactors.pH !== undefined && (
                  <FactorTile label="pH" value={decision.soilFactors.pH.toFixed(2)} tone="purple" />
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState title="No decision yet" description="Generate a recommendation when the required field data is available." />
      )}
    </section>
  );

  return (
    <Layout>
      <PageHeader
        title="AI Decision Support"
        description="Rule-based decision support based on weather, soil, vegetation, and crop age data"
      />

      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <ActionToolbar
        filters={
          <Select
            label="Select Field"
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
            options={fields.map((f) => ({ value: f.id, label: f.name }))}
            className="mb-0"
          />
        }
        status={
          <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <ShieldCheck size={16} className={isReadOnly ? 'text-primary-700' : 'text-gray-500'} />
            {isReadOnly ? 'Demo read-only' : 'Decision tools enabled'}
          </div>
        }
      />

      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Decision prerequisites</h3>
              <p className="mt-1 text-sm text-gray-600">
                Irrigation recommendations require latest sensor and weather data unless demo mode is enabled.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['sensor', 'weather', 'ndvi'].map((key) => (
                  <Badge
                    key={key}
                    variant={prerequisites?.latestData?.[key as keyof AIDecisionPrerequisites['latestData']] ? 'success' : 'warning'}
                  >
                    {key}: {prerequisites?.latestData?.[key as keyof AIDecisionPrerequisites['latestData']] ? 'available' : 'missing'}
                  </Badge>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={demoMode}
                disabled={isReadOnly}
                onChange={(event) => setDemoMode(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Demo mode
            </label>
          </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <DecisionPanel
          title="Irrigation Recommendation"
          icon={Droplets}
          decision={irrigationDecision}
          isGenerating={isGenerating === 'irrigation'}
          onGenerate={() => generateDecision('irrigation')}
          disabled={isReadOnly || (!demoMode && prerequisites?.canGenerate.irrigation === false)}
          helper={
            !demoMode && prerequisites?.canGenerate.irrigation === false
              ? `Missing: ${prerequisites.missing.irrigation.join(', ')}`
              : demoMode
              ? 'Demo mode will explicitly create simulated sensor data and fetch weather before generating.'
              : undefined
          }
        />

        <DecisionPanel
          title="Harvest Readiness"
          icon={Calendar}
          decision={harvestDecision}
          isGenerating={isGenerating === 'harvest'}
          onGenerate={() => generateDecision('harvest')}
          disabled={isReadOnly}
        />

        <DecisionPanel
          title="Risk Assessment"
          icon={AlertTriangle}
          decision={riskAssessment}
          isGenerating={isGenerating === 'risk'}
          onGenerate={() => generateDecision('risk')}
          disabled={isReadOnly}
        />
      </div>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-950">Decision History</h3>
              <p className="text-sm text-gray-600">Compact record of generated recommendations for the selected field.</p>
            </div>
            {historyMeta && historyMeta.total > 0 && (
              <span className="text-sm text-gray-500">{historyMeta.total} total decisions</span>
            )}
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {decisionHistory.length > 0 ? (
            decisionHistory.map((decision) => (
              <article key={decision.id} className="px-4 py-3 transition-colors hover:bg-gray-50 sm:px-5">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_9rem_auto] sm:items-center lg:grid-cols-[10rem_minmax(0,1fr)_9rem_10rem_auto]">
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge variant={getRecommendationColor(decision.recommendation) as any}>
                      {decision.decisionType}
                    </Badge>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-950">
                      {decision.recommendation.replace(/_/g, ' ')}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 sm:hidden">
                      Confidence {(decision.confidence * 100).toFixed(0)}% · {formatDecisionDate(decision.createdAt)}
                    </p>
                  </div>
                  <div className="hidden text-sm text-gray-600 sm:block">
                    {(decision.confidence * 100).toFixed(0)}% confidence
                  </div>
                  <div className="hidden text-sm text-gray-600 lg:block">
                    {formatDecisionDate(decision.createdAt)}
                  </div>
                  <button
                    type="button"
                    aria-label={
                      expandedHistory === decision.id
                        ? `Collapse ${decision.decisionType} decision`
                        : `Expand ${decision.decisionType} decision`
                    }
                    onClick={() => setExpandedHistory(expandedHistory === decision.id ? null : decision.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {expandedHistory === decision.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                {expandedHistory === decision.id && (
                  <div className="mt-3 rounded-md bg-gray-50 p-3">
                    <p className="text-sm leading-relaxed text-gray-700">{decision.explanation}</p>
                  </div>
                )}
              </article>
            ))
          ) : (
            <div className="p-4">
              <EmptyState title="No decision history" description="Generated recommendations will appear here as a compact list." />
            </div>
          )}
        </div>
        {historyMeta && historyMeta.total > 0 && (
          <PaginationControls
            page={historyMeta.page}
            totalPages={historyMeta.totalPages}
            totalItems={historyMeta.total}
            pageSize={historyMeta.limit}
            onPageChange={setHistoryPage}
            className="mx-4 mb-4 sm:mx-5"
          />
        )}
      </section>
    </Layout>
  );
};
