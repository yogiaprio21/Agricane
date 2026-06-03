'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Layout } from '../components/common/Layout';
import { Badge, Button, ChartCard, ChartEmptyState, FilterPanel, MetricStrip, PageHeader, Select, Spinner } from '../components/common';
import { fieldService } from '../services/field.service';
import { iotService } from '../services/iot.service';
import { websocketService } from '../services/websocket.service';
import { Field, Role, SensorReading } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label } from 'recharts';
import { Activity, Droplets, Thermometer, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { authService } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';

export const IoTMonitoring: React.FC = () => {
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isLivePaused, setIsLivePaused] = useState(false);

  const loadFields = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fieldService.getAll();
      setFields(data);
      if (data.length > 0 && !selectedFieldId) {
        setSelectedFieldId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load fields:', error);
      toast.error('Failed to load fields.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFieldId]);

  const loadSensorData = useCallback(async () => {
    if (!selectedFieldId) return;
    try {
      setIsLoading(true);
      const { history, latest } = await iotService.getMonitoringData(selectedFieldId, 24);
      setSensorData(history);
      if (latest.length > 0) {
        setLatestReading(latest[0]);
      }
    } catch (error) {
      console.error('Failed to load sensor data:', error);
      toast.error('Failed to load sensor data.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFieldId]);

  const connectWebSocket = useCallback(() => {
    const token = authService.getAccessToken();
    if (!token || !selectedFieldId) return;
    if (isLivePaused) {
      websocketService.disconnect();
      setIsLive(false);
      return;
    }

    websocketService.connect(token);
    websocketService.subscribeToField(selectedFieldId);
    websocketService.onConnectionChange(setIsLive);

    websocketService.onSensorUpdate((data) => {
      if (data.fieldId === selectedFieldId) {
        setLatestReading(data.reading);
        setSensorData((prev) => [data.reading, ...prev].slice(0, 100));
        toast.success('New sensor data received!');
      }
    });
  }, [selectedFieldId, isLivePaused]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  useEffect(() => {
    if (selectedFieldId) {
      loadSensorData();
      connectWebSocket();
    }

    return () => {
      if (selectedFieldId) {
        websocketService.unsubscribeFromField(selectedFieldId);
        websocketService.offSensorUpdate();
        websocketService.offConnectionChange();
      }
    };
  }, [selectedFieldId, loadSensorData, connectWebSocket]);

  const handleSimulate = async () => {
    if (!selectedFieldId) return;
    setIsSimulating(true);
    try {
      await iotService.simulate(selectedFieldId);
      toast.success('New sensor data simulated. Waiting for update...');
      setTimeout(loadSensorData, 1000);
    } catch (error) {
      console.error('Failed to simulate data:', error);
      toast.error('Failed to simulate new data.');
    } finally {
      setIsSimulating(false);
    }
  };

  if (isLoading && fields.length === 0) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  const getThresholdStatus = (value: number, min: number, max: number) => {
    if (value < min || value > max) return 'danger';
    if (value < min + (max - min) * 0.1 || value > max - (max - min) * 0.1) return 'warning';
    return 'success';
  };

  const moistureStatus = latestReading ? getThresholdStatus(latestReading.soilMoisture, 40, 70) : 'info';
  const phStatus = latestReading ? getThresholdStatus(latestReading.soilPH, 6.0, 7.5) : 'info';
  const tempStatus = latestReading ? getThresholdStatus(latestReading.soilTemperature, 20, 30) : 'info';
  const isReadOnly = user?.role === Role.VIEWER;

  return (
    <Layout>
      <PageHeader
        title="IoT Sensor Monitoring"
        description="Real-time soil sensor data from your fields"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!isReadOnly && (
              <>
                <Button
                  onClick={handleSimulate}
                  disabled={isSimulating || !selectedFieldId}
                  isLoading={isSimulating}
                  leftIcon={<RefreshCw size={16} />}
                >
                  {isSimulating ? 'Simulating...' : 'Simulate New Data'}
                </Button>
                <Button
                  onClick={() => setIsLivePaused((current) => !current)}
                  variant="outline"
                >
                  {isLivePaused ? 'Resume Live' : 'Pause Live'}
                </Button>
              </>
            )}
            <div className="flex min-h-9 items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
              <div className={`h-3 w-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-600">
                {isReadOnly ? 'Demo read-only' : isLivePaused ? 'Paused' : isLive ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        }
      />

      <FilterPanel columnsClassName="md:grid-cols-[minmax(16rem,28rem)]">
        <Select
          label="Select Field"
          value={selectedFieldId}
          onChange={(e) => setSelectedFieldId(e.target.value)}
          options={fields.map((f) => ({ value: f.id, label: f.name }))}
          className="mb-0"
        />
      </FilterPanel>

      {isLoading && <Spinner />}
      {!isLoading && !latestReading && <p>No sensor data available for this field.</p>}

      {latestReading && (
        <MetricStrip
          className="mb-6 xl:grid-cols-3"
          items={[
            {
              label: 'Soil Moisture',
              value: `${latestReading.soilMoisture.toFixed(1)}%`,
              description: <span className="flex flex-wrap items-center gap-2">Optimal 40-70% <Badge variant={moistureStatus}>{moistureStatus === 'success' ? 'Normal' : moistureStatus === 'warning' ? 'Warning' : 'Critical'}</Badge></span>,
              tone: moistureStatus === 'success' ? 'green' : moistureStatus === 'warning' ? 'yellow' : 'red',
              icon: <Droplets size={22} />,
            },
            {
              label: 'Soil pH',
              value: latestReading.soilPH.toFixed(2),
              description: <span className="flex flex-wrap items-center gap-2">Optimal 6.0-7.5 <Badge variant={phStatus}>{phStatus === 'success' ? 'Normal' : phStatus === 'warning' ? 'Warning' : 'Critical'}</Badge></span>,
              tone: phStatus === 'success' ? 'green' : phStatus === 'warning' ? 'yellow' : 'red',
              icon: <Activity size={22} />,
            },
            {
              label: 'Soil Temperature',
              value: `${latestReading.soilTemperature.toFixed(1)}°C`,
              description: <span className="flex flex-wrap items-center gap-2">Optimal 20-30°C <Badge variant={tempStatus}>{tempStatus === 'success' ? 'Normal' : tempStatus === 'warning' ? 'Warning' : 'Critical'}</Badge></span>,
              tone: tempStatus === 'success' ? 'green' : tempStatus === 'warning' ? 'yellow' : 'red',
              icon: <Thermometer size={22} />,
            },
          ]}
        />
      )}

      <div className="grid grid-cols-1 gap-6">
        <ChartCard title="Sensor Data Trends (24h)" subtitle="Live soil moisture, pH, and temperature readings for the selected field">
          {sensorData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={sensorData.slice().reverse()} margin={{ top: 8, right: 28, bottom: 36, left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => format(new Date(value), 'HH:mm')}
              >
                <Label value="Time" offset={-24} position="insideBottom" />
              </XAxis>
              <YAxis yAxisId="left" orientation="left" stroke="#3b82f6">
                <Label value="Soil moisture (%)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
              </YAxis>
              <YAxis yAxisId="right" orientation="right" stroke="#ef4444">
                <Label value="Soil temperature (C)" angle={90} position="insideRight" style={{ textAnchor: 'middle' }} />
              </YAxis>
              <YAxis yAxisId="ph" orientation="right" domain={[5, 9]} tickFormatter={(val) => val.toFixed(1)} hide={true} />
              <Tooltip
                labelFormatter={(value) => format(new Date(value), 'MMM dd, HH:mm')}
                formatter={(value: number, name: string) => {
                  if (name === 'Soil Moisture (%)') return [`${value.toFixed(1)}%`, name];
                  if (name === 'Soil Temperature (°C)') return [`${value.toFixed(1)}°C`, name];
                  if (name === 'Soil pH') return [value.toFixed(2), name];
                  return [value, name];
                }}
              />
              <Legend verticalAlign="top" height={28} />
              <Line yAxisId="left" type="monotone" dataKey="soilMoisture" stroke="#3b82f6" strokeWidth={2} name="Soil Moisture (%)" />
              <Line yAxisId="right" type="monotone" dataKey="soilTemperature" stroke="#ef4444" strokeWidth={2} name="Soil Temperature (°C)" />
              <Line yAxisId="ph" type="monotone" dataKey="soilPH" stroke="#22c55e" strokeWidth={2} name="Soil pH" />
            </LineChart>
          </ResponsiveContainer>
          ) : (
            <ChartEmptyState title="No sensor trend data" description="Simulate new data or connect field sensors to populate this chart." />
          )}
        </ChartCard>
      </div>
    </Layout>
  );
};
