import React, { useEffect, useState } from 'react';
import { Layout } from '../components/common/Layout';
import { ChartCard, ChartEmptyState, DataList, MetricStrip, PageHeader, SectionPanel, Spinner } from '../components/common';
import { fieldService } from '../services/field.service';
import { monitoringService } from '../services/monitoring.service';
import { healthService } from '../services/health.service';
import { Field, FieldHealth, IntegrationStatusResponse } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Leaf, AlertTriangle, CheckCircle, TrendingUp, Server } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [healthSummary, setHealthSummary] = useState<FieldHealth[]>([]);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [fieldsData, healthData, integrations] = await Promise.all([
        fieldService.getAll(),
        monitoringService.getHealthSummary(),
        healthService.getIntegrations().catch(() => null),
      ]);
      setFields(fieldsData);
      setHealthSummary(healthData);
      setIntegrationStatus(integrations);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
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

  const healthyCounts = {
    HEALTHY: healthSummary.filter((h) => h.healthStatus === 'HEALTHY').length,
    MODERATE_STRESS: healthSummary.filter((h) => h.healthStatus === 'MODERATE_STRESS').length,
    SEVERE_STRESS: healthSummary.filter((h) => h.healthStatus === 'SEVERE_STRESS').length,
    UNKNOWN: healthSummary.filter((h) => h.healthStatus === 'UNKNOWN').length,
  };

  const healthChartData = [
    { name: 'Healthy', value: healthyCounts.HEALTHY, color: '#22c55e' },
    { name: 'Moderate', value: healthyCounts.MODERATE_STRESS, color: '#eab308' },
    { name: 'Severe', value: healthyCounts.SEVERE_STRESS, color: '#ef4444' },
    { name: 'Unknown', value: healthyCounts.UNKNOWN, color: '#94a3b8' },
  ];

  const totalArea = fields.reduce((sum, f) => sum + f.areaHectares, 0);
  const alertCount = healthyCounts.MODERATE_STRESS + healthyCounts.SEVERE_STRESS;

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        description="Overview of your sugarcane plantation operations"
      />

      <MetricStrip
        className="mb-6"
        items={[
          { label: 'Total Fields', value: fields.length, icon: <Leaf size={22} />, tone: 'green' },
          { label: 'Total Area', value: totalArea.toFixed(1), description: 'hectares', tone: 'blue', icon: <TrendingUp size={22} /> },
          { label: 'Healthy Fields', value: healthyCounts.HEALTHY, tone: 'green', icon: <CheckCircle size={22} /> },
          { label: 'Active Alerts', value: alertCount, tone: alertCount > 0 ? 'yellow' : 'gray', icon: <AlertTriangle size={22} /> },
        ]}
      />

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Field Health Status" subtitle="Distribution by latest NDVI health status">
          {healthSummary.length === 0 ? (
            <ChartEmptyState
              title="No health data yet"
              description="Fetch NDVI data from Satellite Monitoring to populate field health status."
            />
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                  <Pie
                    data={healthChartData.filter((item) => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={78}
                    paddingAngle={3}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {healthChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [value, name]} />
                  <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {healthChartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-2">
                    <span className="flex items-center gap-2 text-gray-700">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-semibold text-gray-950">{item.value} fields</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        <SectionPanel title="Recent Fields" subtitle="Latest plantation blocks and health status" className="pt-0">
          <DataList
            items={fields.slice(0, 5).map((field) => {
              const health = healthSummary.find((h) => h.fieldId === field.id);
              const state = health?.healthStatus || 'UNKNOWN';
              return {
                id: field.id,
                title: field.name,
                subtitle: `${field.locationName || 'Location not named'} - ${field.areaHectares} ha - ${field.sugarcaneVariety}`,
                badge: (
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      state === 'HEALTHY'
                        ? 'bg-green-100 text-green-800'
                        : state === 'MODERATE_STRESS'
                        ? 'bg-yellow-100 text-yellow-800'
                        : state === 'SEVERE_STRESS'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {state}
                  </span>
                ),
              };
            })}
          />
        </SectionPanel>

        <SectionPanel title="System Status" subtitle="External integrations and runtime readiness" className="pt-0">
          <div className="mb-3 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Integration health</p>
              <p className="text-sm text-gray-600">
                {integrationStatus
                  ? `Last checked ${new Date(integrationStatus.checkedAt).toLocaleTimeString()}`
                  : 'Status unavailable'}
              </p>
            </div>
            <div
              className={`rounded-full p-2 ${
                integrationStatus?.status === 'ok' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              <Server size={22} />
            </div>
          </div>

          {integrationStatus?.integrations ? (
            <DataList
              items={integrationStatus.integrations.map((integration) => ({
                id: integration.name,
                title: integration.name,
                subtitle: integration.provider || integration.details,
                badge: (
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                      integration.state === 'healthy' || integration.state === 'configured'
                        ? 'bg-green-100 text-green-800'
                        : integration.state === 'disabled'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {integration.state}
                  </span>
                ),
              }))}
            />
          ) : (
              <p className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                Integration status could not be loaded.
              </p>
          )}
        </SectionPanel>
      </div>
    </Layout>
  );
};
