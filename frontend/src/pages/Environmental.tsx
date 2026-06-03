import React, { useEffect, useState } from 'react';
import { Layout } from '../components/common/Layout';
import { Button, ChartCard, ChartEmptyState, FilterPanel, InfoGrid, MetricStrip, PageHeader, SectionPanel, Select, SourceBadge, Spinner } from '../components/common';
import { fieldService } from '../services/field.service';
import { environmentalService } from '../services/environmental.service';
import { Field, Role, WeatherData, WeatherForecastResponse, WeatherStats } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label } from 'recharts';
import { Cloud, Droplets, Thermometer, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';

export const Environmental: React.FC = () => {
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [weatherHistory, setWeatherHistory] = useState<WeatherData[]>([]);
  const [weatherStats, setWeatherStats] = useState<WeatherStats | null>(null);
  const [forecast, setForecast] = useState<WeatherForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [days, setDays] = useState(7);
  const [forecastSlots, setForecastSlots] = useState(8);

  useEffect(() => {
    loadFields();
  }, []);

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

  const getWeatherState = async (fieldId: string, rangeDays: number, slots: number) => {
    const [history, stats, forecastData] = await Promise.all([
      environmentalService.getHistory(fieldId, rangeDays),
      environmentalService.getStats(fieldId, rangeDays),
      environmentalService.getForecast(fieldId, slots).catch(() => null),
    ]);

    return { history, stats, forecastData };
  };

  useEffect(() => {
    if (!selectedFieldId) return;

    let isCurrent = true;
    setIsDataLoading(true);

    getWeatherState(selectedFieldId, days, forecastSlots)
      .then(({ history, stats, forecastData }) => {
        if (!isCurrent) return;
        setWeatherHistory(history);
        setWeatherStats(stats);
        setForecast(forecastData);
      })
      .catch((error) => {
        if (isCurrent) {
          console.error('Failed to load weather data:', error);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsDataLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedFieldId, days, forecastSlots]);

  const applyWeatherState = async () => {
    if (!selectedFieldId) return;
    const { history, stats, forecastData } = await getWeatherState(selectedFieldId, days, forecastSlots);
    setWeatherHistory(history);
    setWeatherStats(stats);
    setForecast(forecastData);
  };

  const handleFetchWeather = async () => {
    setIsFetching(true);
    try {
      await environmentalService.fetchWeather(selectedFieldId);
      await applyWeatherState();
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    } finally {
      setIsFetching(false);
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

  const latestWeather = weatherHistory[0];
  const selectedField = fields.find((field) => field.id === selectedFieldId);
  const isReadOnly = user?.role === Role.VIEWER;
  const forecastItems = forecast?.forecast || [];
  const rangeLabel = `Last ${days} days`;

  return (
    <Layout>
      <PageHeader
        title="Environmental Monitoring"
        description="Weather data and climate analytics from OpenWeatherMap"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!isReadOnly && (
              <Button onClick={handleFetchWeather} disabled={isFetching || isDataLoading || !selectedFieldId} isLoading={isFetching} leftIcon={<RefreshCw size={18} />}>
                Fetch Latest
              </Button>
            )}
            {isReadOnly && (
              <span className="rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600">Demo read-only</span>
            )}
            {!isReadOnly && forecast && <SourceBadge sourceType={forecast.sourceType} provider={forecast.provider} />}
          </div>
        }
      />

      <FilterPanel columnsClassName="md:grid-cols-3">
        <Select
          label="Select Field"
          value={selectedFieldId}
          onChange={(e) => setSelectedFieldId(e.target.value)}
          options={fields.map((f) => ({ value: f.id, label: f.name }))}
          className="mb-0"
        />
        <Select
          label="Time Range"
          value={days.toString()}
          onChange={(e) => setDays(parseInt(e.target.value))}
          options={[
            { value: '7', label: 'Last 7 days' },
            { value: '14', label: 'Last 14 days' },
            { value: '30', label: 'Last 30 days' },
          ]}
          className="mb-0"
        />
        <Select
          label="Forecast Window"
          value={forecastSlots.toString()}
          onChange={(e) => setForecastSlots(parseInt(e.target.value))}
          options={[
            { value: '8', label: 'Next 24 hours' },
            { value: '16', label: 'Next 48 hours' },
            { value: '40', label: 'Next 5 days' },
          ]}
          className="mb-0"
        />
      </FilterPanel>

      <SectionPanel title={selectedField?.name || 'No field selected'} subtitle={selectedField?.locationName || 'Location name not available'} className="mb-5 pt-0">
        <InfoGrid
          className="grid-cols-2 lg:grid-cols-4"
          items={[
            { label: 'Latitude', value: selectedField?.latitude.toFixed(4) || '-' },
            { label: 'Longitude', value: selectedField?.longitude.toFixed(4) || '-' },
            { label: 'Area', value: selectedField ? `${selectedField.areaHectares} ha` : '-' },
            { label: 'Variety', value: selectedField?.sugarcaneVariety || '-' },
          ]}
        />
        {latestWeather && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <SourceBadge sourceType={latestWeather.sourceType || 'HISTORY'} provider={latestWeather.provider || latestWeather.source} />
            {isDataLoading && <span>Refreshing selected range...</span>}
          </div>
        )}
      </SectionPanel>

      {forecastItems.length > 0 && (
        <SectionPanel
          title={`${forecastSlots === 40 ? '5-Day' : forecastSlots === 16 ? '48-Hour' : '24-Hour'} Weather Forecast`}
          subtitle="3-hour weather windows for selected field operations"
          className="mb-5"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            {forecastItems.map((item, index) => (
              <div key={`${item.datetime}-${index}`} className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{format(new Date(item.datetime), 'MMM dd')}</p>
                    <p className="text-xs text-gray-500">{format(new Date(item.datetime), 'HH:mm')}</p>
                  </div>
                  <Cloud size={17} className="text-cyan-600" />
                </div>
                <p className="mt-2 text-xl font-bold text-gray-950">{item.temperature.toFixed(0)}°C</p>
                <p className="mt-1 min-h-8 text-xs capitalize text-gray-600">{item.weatherDesc}</p>
                <div className="mt-2 space-y-1 text-xs text-gray-500">
                  <p>Humidity {item.humidity}%</p>
                  <p>{item.rainfall > 0 ? `Rain ${item.rainfall}mm` : 'No rain'}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>
      )}

      {weatherStats && (
        <MetricStrip
          className="mb-5 xl:grid-cols-3"
          items={[
            { label: 'Avg Temperature', value: `${weatherStats.avgTemperature.toFixed(1)}°C`, description: rangeLabel, tone: 'yellow', icon: <Thermometer size={22} /> },
            { label: 'Avg Humidity', value: `${weatherStats.avgHumidity.toFixed(1)}%`, description: rangeLabel, tone: 'blue', icon: <Droplets size={22} /> },
            { label: 'Total Rainfall', value: `${weatherStats.totalRainfall.toFixed(1)} mm`, description: `${rangeLabel} · ${weatherStats.dataPoints} points`, tone: 'gray', icon: <Cloud size={22} /> },
          ]}
        />
      )}

      <div className="mb-6 grid grid-cols-1 gap-5">
        <ChartCard title="Temperature Trend" subtitle="Daily temperature movement for the selected field">
          {weatherHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weatherHistory.slice().reverse()} margin={{ top: 8, right: 24, bottom: 36, left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="recordedAt"
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              >
                <Label value="Date" offset={-24} position="insideBottom" />
              </XAxis>
              <YAxis>
                <Label value="Temperature (C)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
              </YAxis>
              <Tooltip
                labelFormatter={(value) => format(new Date(value), 'MMM dd, HH:mm')}
                formatter={(value: number) => [`${value.toFixed(1)}°C`, 'Temperature']}
              />
              <Legend verticalAlign="top" height={24} />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Temperature (°C)"
              />
            </LineChart>
          </ResponsiveContainer>
          ) : (
            <ChartEmptyState title="No temperature history" description="Fetch latest weather data for the selected field." />
          )}
        </ChartCard>

        <ChartCard title="Humidity & Rainfall" subtitle="Moisture conditions and rainfall events across the selected range">
          {weatherHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weatherHistory.slice().reverse()} margin={{ top: 8, right: 28, bottom: 36, left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="recordedAt"
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              >
                <Label value="Date" offset={-24} position="insideBottom" />
              </XAxis>
              <YAxis yAxisId="left">
                <Label value="Humidity (%)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
              </YAxis>
              <YAxis yAxisId="right" orientation="right">
                <Label value="Rainfall (mm)" angle={90} position="insideRight" style={{ textAnchor: 'middle' }} />
              </YAxis>
              <Tooltip
                labelFormatter={(value) => format(new Date(value), 'MMM dd, HH:mm')}
              />
              <Legend verticalAlign="top" height={24} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="humidity"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Humidity (%)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="rainfall"
                stroke="#06b6d4"
                strokeWidth={2}
                name="Rainfall (mm)"
              />
            </LineChart>
          </ResponsiveContainer>
          ) : (
            <ChartEmptyState title="No humidity or rainfall history" description="Fetch latest weather data for the selected field." />
          )}
        </ChartCard>
      </div>

    </Layout>
  );
};
