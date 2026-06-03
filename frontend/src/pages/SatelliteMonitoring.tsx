import React, { useEffect, useState } from 'react';
import { Layout } from '../components/common/Layout';
import {
  Badge,
  Button,
  ConfirmDialog,
  Alert,
  DataList,
  EmptyState,
  FilterPanel,
  IconButton,
  Input,
  MetricStrip,
  Modal,
  PageHeader,
  PaginationControls,
  ResponsiveTable,
  SectionPanel,
  Select,
  SourceBadge,
  Spinner,
  ChartCard,
  ChartEmptyState,
} from '../components/common';
import { fieldService } from '../services/field.service';
import { monitoringService } from '../services/monitoring.service';
import { Field, FieldHealth, NDVIData, DroneFlight } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label } from 'recharts';
import { Plus, Edit, Trash2, RefreshCw, Leaf, Plane, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';

export const SatelliteMonitoring: React.FC = () => {
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [healthSummary, setHealthSummary] = useState<FieldHealth[]>([]);
  const [ndviHistory, setNdviHistory] = useState<NDVIData[]>([]);
  const [droneFlights, setDroneFlights] = useState<DroneFlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<DroneFlight | null>(null);
  const [flightToDelete, setFlightToDelete] = useState<DroneFlight | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [flightPage, setFlightPage] = useState(1);
  const flightPageSize = 6;
  const [formData, setFormData] = useState({
    fieldId: '',
    flightDate: '',
    duration: '',
    altitudeMeters: '',
    notes: '',
    imageCount: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedFieldId) {
      loadFieldData();
      setFlightPage(1);
    }
  }, [selectedFieldId]);

  const loadData = async () => {
    try {
      const [fieldsData, healthData] = await Promise.all([
        fieldService.getAll(),
        monitoringService.getHealthSummary(),
      ]);
      setFields(fieldsData);
      setHealthSummary(healthData);
      if (fieldsData.length > 0) {
        setSelectedFieldId(fieldsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load satellite monitoring data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFieldData = async () => {
    try {
      const [ndviData, flightsData] = await Promise.all([
        monitoringService.getNDVIHistory(selectedFieldId, 90),
        monitoringService.getDroneFlights(selectedFieldId),
      ]);
      setNdviHistory(ndviData);
      setDroneFlights(flightsData);
    } catch (error) {
      console.error('Failed to load field data:', error);
      setError('Failed to load NDVI or drone flight data');
    }
  };

  const handleFetchNDVI = async () => {
    setIsFetching(true);
    try {
      await monitoringService.fetchNDVI(selectedFieldId);
      await loadFieldData();
    } catch (error) {
      console.error('Failed to fetch NDVI:', error);
      setError('Failed to fetch NDVI data');
    } finally {
      setIsFetching(false);
    }
  };

  const handleOpenModal = (flight?: DroneFlight) => {
    setEditingFlight(flight || null);
    setFormData(
      flight
        ? {
            fieldId: flight.fieldId || selectedFieldId,
            flightDate: new Date(flight.flightDate).toISOString().split('T')[0],
            duration: flight.duration.toString(),
            altitudeMeters: flight.altitudeMeters.toString(),
            notes: flight.notes || '',
            imageCount: flight.imageCount?.toString() || '',
          }
        : {
            fieldId: selectedFieldId,
            flightDate: new Date().toISOString().split('T')[0],
            duration: '',
            altitudeMeters: '',
            notes: '',
            imageCount: '',
          },
    );
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    setError('');

    const flightDate = new Date(formData.flightDate);
    const duration = parseInt(formData.duration);
    const altitudeMeters = parseFloat(formData.altitudeMeters);
    const imageCount = parseInt(formData.imageCount) || 0;

    if (!formData.fieldId) {
      setError('Field is required for a drone flight log');
      return;
    }

    if (!formData.flightDate || Number.isNaN(flightDate.getTime())) {
      setError('Flight date is required');
      return;
    }

    if (flightDate > new Date()) {
      setError('Flight date cannot be in the future');
      return;
    }

    if (Number.isNaN(duration) || duration < 1) {
      setError('Duration must be at least 1 minute');
      return;
    }

    if (Number.isNaN(altitudeMeters) || altitudeMeters < 1 || altitudeMeters > 500) {
      setError('Altitude must be between 1 and 500 meters');
      return;
    }

    if (imageCount < 0) {
      setError('Image count cannot be negative');
      return;
    }

    try {
      const payload = {
        flightDate: flightDate.toISOString(),
        duration,
        altitudeMeters,
        notes: formData.notes,
        imageCount,
      };

      if (editingFlight) {
        await monitoringService.updateDroneFlight(editingFlight.id, payload);
        setSuccess('Drone flight updated successfully');
      } else {
        await monitoringService.createDroneFlight({
          fieldId: formData.fieldId,
          operatorId: user?.id,
          ...payload,
        });
        setSuccess('Drone flight logged successfully');
      }

      setIsModalOpen(false);
      setEditingFlight(null);
      loadFieldData();
    } catch (error) {
      console.error('Failed to save drone flight:', error);
      setError('Failed to save drone flight');
    }
  };

  const handleConfirmDeleteFlight = async () => {
    if (!flightToDelete) return;

    try {
      await monitoringService.deleteDroneFlight(flightToDelete.id);
      setFlightToDelete(null);
      setSuccess('Drone flight deleted successfully');
      loadFieldData();
    } catch (error) {
      console.error('Failed to delete flight:', error);
      setError('Failed to delete drone flight');
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

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'success';
      case 'MODERATE_STRESS': return 'warning';
      case 'SEVERE_STRESS': return 'danger';
      default: return 'info';
    }
  };

  const latestNdvi = ndviHistory[0];
  const latestNdviSourceType =
    latestNdvi?.sourceType ||
    latestNdvi?.metadata?.sourceType ||
    (latestNdvi?.source?.toLowerCase().includes('simulated') ? 'SIMULATED' : latestNdvi ? 'LIVE' : undefined);
  const selectedField = fields.find((field) => field.id === selectedFieldId);
  const selectedHealth = healthSummary.find((health) => health.fieldId === selectedFieldId);
  const pagedDroneFlights = droneFlights.slice((flightPage - 1) * flightPageSize, flightPage * flightPageSize);
  const isReadOnly = user?.role === Role.VIEWER;

  return (
    <Layout>
      <PageHeader
        title="Satellite & Drone Monitoring"
        description="NDVI vegetation analysis and drone flight management"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!isReadOnly && (
              <>
                <Button onClick={handleFetchNDVI} disabled={isFetching || !selectedFieldId} isLoading={isFetching} leftIcon={<RefreshCw size={18} />}>
                  Fetch NDVI
                </Button>
                <Button onClick={() => handleOpenModal()} leftIcon={<Plus size={18} />}>
                  Log Drone Flight
                </Button>
              </>
            )}
            {isReadOnly && (
              <span className="rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600">Demo read-only</span>
            )}
          </div>
        }
      />

      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      <FilterPanel columnsClassName="md:grid-cols-[minmax(16rem,28rem)]">
        <Select
          label="Select Field"
          value={selectedFieldId}
          onChange={(e) => setSelectedFieldId(e.target.value)}
          options={fields.map((f) => ({ value: f.id, label: f.name }))}
          className="mb-0"
        />
      </FilterPanel>

      <MetricStrip
        className="mb-6 xl:grid-cols-3"
        items={[
          {
            label: 'Selected Field',
            value: selectedField?.name || '-',
            description: selectedField ? `${selectedField.locationName || 'Location not named'} - ${selectedField.areaHectares} ha` : 'No field selected',
            tone: 'green',
            icon: <Leaf size={22} />,
          },
          {
            label: 'Latest NDVI',
            value: latestNdvi ? latestNdvi.ndviValue.toFixed(3) : selectedHealth?.latestNDVI?.toFixed(3) || '-',
            description: selectedHealth?.healthStatus || 'No vegetation status',
            tone: 'blue',
            icon: <Activity size={22} />,
          },
          { label: 'Drone Flights', value: droneFlights.length, description: 'Logged observations', tone: 'gray', icon: <Plane size={22} /> },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SectionPanel title="Field Health Summary" subtitle="All fields ranked by latest vegetation condition" className="pt-0">
          <DataList
            items={healthSummary.map((health) => ({
              id: health.fieldId,
              title: health.fieldName,
              subtitle: `NDVI: ${health.latestNDVI?.toFixed(3) || 'N/A'}`,
              badge: <Badge variant={getHealthColor(health.healthStatus) as any}>{health.healthStatus}</Badge>,
            }))}
          />
        </SectionPanel>

        <ChartCard
          title="NDVI Trend (90 days)"
          subtitle="Vegetation index trend for the selected field"
          actions={latestNdvi ? <SourceBadge sourceType={latestNdviSourceType} provider={latestNdvi?.provider || latestNdvi?.source} /> : undefined}
        >
          {ndviHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ndviHistory.slice().reverse()} margin={{ top: 8, right: 16, bottom: 36, left: 16 }}>
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
                  formatter={(value: number) => [value.toFixed(3), 'NDVI']}
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
            <ChartEmptyState
              title="No NDVI history yet"
              description="Fetch NDVI for the selected field to start building vegetation trend history."
            />
          )}
            <div className="mt-4 flex justify-between text-sm">
              <div>
                <span className="text-gray-600">Healthy: </span>
                <span className="font-semibold text-green-600">&gt;0.6</span>
              </div>
              <div>
                <span className="text-gray-600">Moderate: </span>
                <span className="font-semibold text-yellow-600">0.4-0.6</span>
              </div>
              <div>
                <span className="text-gray-600">Severe: </span>
                <span className="font-semibold text-red-600">&lt;0.4</span>
              </div>
            </div>
        </ChartCard>
      </div>

      <SectionPanel title="Drone Flight Logs" subtitle="Flight observations, imagery volume, and field notes">
        {droneFlights.length === 0 ? (
            <EmptyState
              title="No drone flights logged"
              description="Log a drone flight to track field observations and image counts."
              action={
                !isReadOnly ? (
                <Button onClick={() => handleOpenModal()}>
                  <Plus size={18} className="mr-2" />
                  Log Drone Flight
                </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <ResponsiveTable
                rows={pagedDroneFlights}
                getRowKey={(flight) => flight.id}
                columns={[
                  {
                    key: 'flightDate',
                    header: 'Flight Date',
                    render: (flight) => format(new Date(flight.flightDate), 'MMM dd, yyyy'),
                  },
                  {
                    key: 'operator',
                    header: 'Operator',
                    render: (flight) => flight.operator ? `${flight.operator.firstName} ${flight.operator.lastName}` : 'N/A',
                  },
                  {
                    key: 'duration',
                    header: 'Duration',
                    render: (flight) => `${flight.duration} min`,
                  },
                  {
                    key: 'altitude',
                    header: 'Altitude',
                    render: (flight) => `${flight.altitudeMeters} m`,
                  },
                  {
                    key: 'images',
                    header: 'Images',
                    render: (flight) => flight.imageCount,
                  },
                  {
                    key: 'notes',
                    header: 'Notes',
                    render: (flight) => flight.notes ? `${flight.notes.substring(0, 50)}${flight.notes.length > 50 ? '...' : ''}` : '-',
                  },
                  ...(!isReadOnly
                    ? [
                        {
                          key: 'actions',
                          header: 'Actions',
                          render: (flight: DroneFlight) => (
                            <div className="flex justify-end gap-2 md:justify-start">
                              <IconButton
                                label={`Edit flight log from ${format(new Date(flight.flightDate), 'MMM dd, yyyy')}`}
                                onClick={() => handleOpenModal(flight)}
                                variant="secondary"
                              >
                                <Edit size={18} />
                              </IconButton>
                              <IconButton
                                label={`Delete flight log from ${format(new Date(flight.flightDate), 'MMM dd, yyyy')}`}
                                onClick={() => setFlightToDelete(flight)}
                                variant="danger"
                              >
                                <Trash2 size={18} />
                              </IconButton>
                            </div>
                          ),
                        },
                      ]
                    : []),
                ]}
              />
              <PaginationControls
                page={flightPage}
                totalPages={Math.max(Math.ceil(droneFlights.length / flightPageSize), 1)}
                totalItems={droneFlights.length}
                pageSize={flightPageSize}
                onPageChange={setFlightPage}
              />
            </>
          )}
      </SectionPanel>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFlight(null);
        }}
        title={editingFlight ? 'Edit Drone Flight' : 'Log Drone Flight'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingFlight(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{editingFlight ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <Input
          label="Flight Date"
          type="date"
          value={formData.flightDate}
          onChange={(e) => setFormData({ ...formData, flightDate: e.target.value })}
          required
        />
        <Input
          label="Duration (minutes)"
          type="number"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          required
        />
        <Input
          label="Altitude (meters)"
          type="number"
          step="0.1"
          value={formData.altitudeMeters}
          onChange={(e) => setFormData({ ...formData, altitudeMeters: e.target.value })}
          required
        />
        <Input
          label="Image Count"
          type="number"
          value={formData.imageCount}
          onChange={(e) => setFormData({ ...formData, imageCount: e.target.value })}
        />
        <Input
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Flight observations..."
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!flightToDelete}
        title="Delete drone flight"
        description={`Delete the drone flight from ${
          flightToDelete ? format(new Date(flightToDelete.flightDate), 'MMM dd, yyyy') : 'this date'
        }?`}
        confirmLabel="Delete flight"
        onConfirm={handleConfirmDeleteFlight}
        onClose={() => setFlightToDelete(null)}
      />
    </Layout>
  );
};
