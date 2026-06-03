import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { Alert, Badge, Button, Card, ChartCard, ChartEmptyState, InfoGrid, MetricStrip, PageHeader, SectionPanel, Skeleton } from '../components/common';
import { fieldService } from '../services/field.service';
import { environmentalService } from '../services/environmental.service';
import { iotService } from '../services/iot.service';
import { monitoringService } from '../services/monitoring.service';
import { Field, WeatherData, SensorReading, NDVIData, GrowthStatus } from '../types';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label } from 'recharts';
import { ArrowLeft, MapPin, Calendar, Leaf, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import 'leaflet/dist/leaflet.css';

export const FieldDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [field, setField] = useState<Field | null>(null);
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [sensors, setSensors] = useState<SensorReading[]>([]);
  const [ndvi, setNdvi] = useState<NDVIData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      loadFieldData();
    }
  }, [id]);

  const loadFieldData = async () => {
    setIsLoading(true);
    setErrors({});
    
    try {
      // Load field data first as it's critical
      const fieldData = await fieldService.getById(id!);
      setField(fieldData);

      // Load auxiliary data in parallel, handling failures individually
      const results = await Promise.allSettled([
        environmentalService.getHistory(id!, 7),
        iotService.getHistory(id!, 24),
        monitoringService.getNDVIHistory(id!, 30),
      ]);

      const [weatherResult, sensorResult, ndviResult] = results;

      if (weatherResult.status === 'fulfilled') {
        setWeather(weatherResult.value);
      } else {
        console.error('Failed to load weather:', weatherResult.reason);
        setErrors(prev => ({ ...prev, weather: 'Failed to load weather history' }));
      }

      if (sensorResult.status === 'fulfilled') {
        setSensors(sensorResult.value);
      } else {
        console.error('Failed to load sensors:', sensorResult.reason);
        setErrors(prev => ({ ...prev, sensors: 'Failed to load sensor history' }));
      }

      if (ndviResult.status === 'fulfilled') {
        setNdvi(ndviResult.value);
      } else {
        console.error('Failed to load NDVI:', ndviResult.reason);
        setErrors(prev => ({ ...prev, ndvi: 'Failed to load NDVI history' }));
      }

    } catch (error) {
      console.error('Failed to load field details:', error);
      setErrors(prev => ({ ...prev, main: 'Failed to load field details' }));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="mb-6">
           <Skeleton width={120} height={40} className="mb-4" />
           <div className="flex justify-between items-start">
             <div>
               <Skeleton width={300} height={40} className="mb-2" />
               <Skeleton width={200} height={20} />
             </div>
             <Skeleton width={100} height={32} />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
           {[1, 2, 3, 4].map(i => (
             <Card key={i}>
                <Skeleton width={100} height={20} className="mb-2" />
                <Skeleton width="80%" height={32} />
             </Card>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
           <Card>
              <Skeleton height={300} />
           </Card>
           <Card>
              <Skeleton height={300} />
           </Card>
        </div>
      </Layout>
    );
  }

  if (errors.main || !field) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-gray-600 mb-4">{errors.main || 'Field not found'}</p>
          <Button onClick={() => navigate('/fields')}>
            Back to Fields
          </Button>
        </div>
      </Layout>
    );
  }

  const getStatusColor = (status: GrowthStatus | string) => {
    switch (status) {
      case GrowthStatus.PLANTED: return 'info';
      case GrowthStatus.GROWING: return 'success';
      case GrowthStatus.HARVEST_READY: return 'warning';
      case GrowthStatus.HARVESTED: return 'info';
      default: return 'info';
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <Button variant="secondary" onClick={() => navigate('/fields')} className="mb-4">
          <ArrowLeft size={18} className="mr-2" />
          Back to Fields
        </Button>
        <PageHeader
          title={field.name}
          description="Field details and monitoring data"
          actions={
            <Badge variant={getStatusColor(field.growthStatus) as any}>
              {field.growthStatus}
            </Badge>
          }
          className="mb-0"
        />
        
        {/* Error Alerts */}
        <div className="mt-4 space-y-2">
          {errors.weather && <Alert type="warning" onClose={() => setErrors(e => ({...e, weather: ''}))}>{errors.weather}</Alert>}
          {errors.sensors && <Alert type="warning" onClose={() => setErrors(e => ({...e, sensors: ''}))}>{errors.sensors}</Alert>}
          {errors.ndvi && <Alert type="warning" onClose={() => setErrors(e => ({...e, ndvi: ''}))}>{errors.ndvi}</Alert>}
        </div>
      </div>

      <MetricStrip
        className="mb-6"
        items={[
          { label: 'Area', value: `${field.areaHectares} ha`, description: 'Mapped field size', tone: 'green', icon: <MapPin size={22} /> },
          { label: 'Crop Age', value: field.cropAgeDays || 0, description: 'days after planting', tone: 'blue', icon: <Leaf size={22} /> },
          { label: 'Variety', value: field.sugarcaneVariety, description: field.growthStatus.replace('_', ' '), tone: 'gray' },
          { label: 'Planted', value: format(new Date(field.plantingDate), 'MMM dd'), description: format(new Date(field.plantingDate), 'yyyy'), tone: 'yellow', icon: <Calendar size={22} /> },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionPanel title="Field Location" subtitle={field.locationName || 'Location name is not set'} className="pt-0">
          <InfoGrid
            className="mb-4 lg:grid-cols-2"
            items={[
              { label: 'Area Name', value: field.locationName || 'Not specified' },
              { label: 'Latitude', value: field.latitude.toFixed(4) },
              { label: 'Longitude', value: field.longitude.toFixed(4) },
              { label: 'Area', value: `${field.areaHectares} ha` },
            ]}
          />
          <div className="relative z-0 h-[320px] overflow-hidden rounded-lg sm:h-[380px]">
            <MapContainer
              center={[field.latitude, field.longitude]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[field.latitude, field.longitude]} />
            </MapContainer>
          </div>
        </SectionPanel>

        <ChartCard title="Recent Soil Moisture Trend" subtitle="X-axis: time, Y-axis: soil moisture percentage">
          {sensors.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={sensors.slice().reverse().slice(-20)} margin={{ top: 8, right: 16, bottom: 36, left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                >
                  <Label value="Time" offset={-24} position="insideBottom" />
                </XAxis>
                <YAxis>
                  <Label value="Soil moisture (%)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip
                  labelFormatter={(value) => format(new Date(value), 'MMM dd, HH:mm')}
                />
                <Legend verticalAlign="top" height={24} />
                <Line
                  type="monotone"
                  dataKey="soilMoisture"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Soil Moisture (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState title="No soil moisture history" description="Simulate or ingest IoT sensor data for this field." />
          )}
        </ChartCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Temperature History (7 days)" subtitle="X-axis: date, Y-axis: temperature in Celsius">
          {weather.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weather.slice().reverse()} margin={{ top: 8, right: 16, bottom: 36, left: 16 }}>
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
            <ChartEmptyState title="No weather history" description="Fetch environmental data for this field." />
          )}
        </ChartCard>

        <ChartCard title="NDVI Vegetation Index" subtitle="X-axis: capture date, Y-axis: NDVI score from 0 to 1">
          {ndvi.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ndvi.slice().reverse()} margin={{ top: 8, right: 16, bottom: 36, left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="captureDate"
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                >
                  <Label value="Capture date" offset={-24} position="insideBottom" />
                </XAxis>
                <YAxis domain={[0, 1]}>
                  <Label value="NDVI value" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip
                  labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                />
                <Legend verticalAlign="top" height={24} />
                <Line
                  type="monotone"
                  dataKey="ndviValue"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="NDVI Value"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState title="No NDVI history" description="Fetch NDVI from Satellite Monitoring." />
          )}
        </ChartCard>
      </div>
    </Layout>
  );
};
