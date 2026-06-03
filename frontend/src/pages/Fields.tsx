import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataToolbar,
  EmptyState,
  IconButton,
  Input,
  Modal,
  PageHeader,
  PaginationControls,
  ResponsiveTable,
  Select,
  MetricStrip,
  SectionPanel,
  Skeleton,
} from '../components/common';
import { fieldService } from '../services/field.service';
import { Field, GrowthStatus, Role } from '../types';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../hooks/useAuth';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const Fields: React.FC = () => {
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'area' | 'age'>('name');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const pageSize = 6;
  const isReadOnly = user?.role === Role.VIEWER;

  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    locationName: '',
    areaHectares: '',
    sugarcaneVariety: '',
    plantingDate: '',
    growthStatus: GrowthStatus.PLANTED,
  });

  useEffect(() => {
    loadFields();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  const loadFields = async () => {
    try {
      const data = await fieldService.getAll();
      setFields(data);
    } catch (error) {
      setError('Failed to load fields');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (field?: Field) => {
    if (field) {
      setEditingField(field);
      setFormData({
        name: field.name,
        latitude: field.latitude.toString(),
        longitude: field.longitude.toString(),
        locationName: field.locationName || '',
        areaHectares: field.areaHectares.toString(),
        sugarcaneVariety: field.sugarcaneVariety,
        plantingDate: field.plantingDate.split('T')[0],
        growthStatus: field.growthStatus,
      });
    } else {
      setEditingField(null);
      setFormData({
        name: '',
        latitude: '',
        longitude: '',
        locationName: '',
        areaHectares: '',
        sugarcaneVariety: '',
        plantingDate: '',
        growthStatus: GrowthStatus.PLANTED,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const latitude = parseFloat(formData.latitude);
    const longitude = parseFloat(formData.longitude);
    const areaHectares = parseFloat(formData.areaHectares);
    const plantingDate = new Date(formData.plantingDate);

    if (!formData.name.trim() || !formData.sugarcaneVariety.trim()) {
      setError('Field name and sugarcane variety are required');
      return;
    }

    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      setError('Latitude must be a number between -90 and 90');
      return;
    }

    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      setError('Longitude must be a number between -180 and 180');
      return;
    }

    if (Number.isNaN(areaHectares) || areaHectares <= 0) {
      setError('Area must be greater than 0 hectares');
      return;
    }

    if (!formData.plantingDate || Number.isNaN(plantingDate.getTime())) {
      setError('Planting date is required');
      return;
    }

    if (plantingDate > new Date()) {
      setError('Planting date cannot be in the future');
      return;
    }

    try {
      const data = {
        name: formData.name,
        latitude,
        longitude,
        locationName: formData.locationName.trim() || undefined,
        areaHectares,
        sugarcaneVariety: formData.sugarcaneVariety,
        plantingDate: plantingDate.toISOString(),
        growthStatus: formData.growthStatus as GrowthStatus,
      };

      if (editingField) {
        await fieldService.update(editingField.id, data);
        setSuccess('Field updated successfully');
      } else {
        await fieldService.create(data);
        setSuccess('Field created successfully');
      }

      setIsModalOpen(false);
      loadFields();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save field');
    }
  };

  const handleConfirmDelete = async () => {
    if (!fieldToDelete) return;

    try {
      await fieldService.delete(fieldToDelete.id);
      setSuccess('Field deleted successfully');
      setFieldToDelete(null);
      loadFields();
    } catch (error) {
      setError('Failed to delete field');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="mb-6 flex justify-between items-center">
          <div>
             <Skeleton width={200} height={32} className="mb-2" />
             <Skeleton width={300} height={20} />
          </div>
          <Skeleton width={120} height={40} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1, 2, 3, 4, 5, 6].map((i) => (
             <Card key={i}>
                <Skeleton height={200} className="mb-4" />
                <Skeleton width="60%" height={24} className="mb-2" />
                <Skeleton width="40%" height={20} className="mb-4" />
                <div className="flex justify-between">
                   <Skeleton width={80} height={32} />
                   <Skeleton width={80} height={32} />
                </div>
             </Card>
           ))}
        </div>
      </Layout>
    );
  }

  const filteredFields = fields
    .filter((field) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        field.name.toLowerCase().includes(query) ||
        field.sugarcaneVariety.toLowerCase().includes(query);
      const matchesStatus = !statusFilter || field.growthStatus === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'area') return b.areaHectares - a.areaHectares;
      if (sortBy === 'age') return (b.cropAgeDays || 0) - (a.cropAgeDays || 0);
      return a.name.localeCompare(b.name);
    });

  const center: [number, number] = filteredFields.length > 0
    ? [filteredFields[0].latitude, filteredFields[0].longitude]
    : [-7.2504, 112.7688];

  return (
    <Layout>
      <PageHeader
        title="Field Management"
        description="Manage your sugarcane plantation fields"
        actions={
          !isReadOnly && (
          <Button onClick={() => handleOpenModal()}>
            <Plus size={20} className="mr-2" />
            Add Field
          </Button>
          )
        }
      />

      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      <DataToolbar>
        <Input
          label="Search fields"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Name or variety"
          className="mb-0 w-full sm:w-72"
        />
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto">
          <Select
            label="Growth status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[
              { value: GrowthStatus.PLANTED, label: 'Planted' },
              { value: GrowthStatus.GROWING, label: 'Growing' },
              { value: GrowthStatus.HARVEST_READY, label: 'Harvest Ready' },
              { value: GrowthStatus.HARVESTED, label: 'Harvested' },
            ]}
            className="mb-0"
          />
          <Select
            label="Sort by"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as 'name' | 'area' | 'age')}
            options={[
              { value: 'name', label: 'Name' },
              { value: 'area', label: 'Area' },
              { value: 'age', label: 'Crop age' },
            ]}
            className="mb-0"
          />
        </div>
      </DataToolbar>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Fields Map">
          <div className="relative z-0 h-[320px] overflow-hidden rounded-lg sm:h-[400px]">
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {filteredFields.map((field) => (
                <Marker key={field.id} position={[field.latitude, field.longitude]}>
                  <Popup>
                    <div>
                      <h3 className="font-semibold">{field.name}</h3>
                      <p className="text-sm">{field.areaHectares} hectares</p>
                      <p className="text-sm">{field.sugarcaneVariety}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </Card>

        <SectionPanel title="Field Statistics" subtitle="Current field portfolio by area and growth stage" className="pt-0">
          <MetricStrip
            className="xl:grid-cols-2"
            items={[
              { label: 'Total Fields', value: fields.length, tone: 'green' },
              { label: 'Total Area', value: `${fields.reduce((sum, f) => sum + f.areaHectares, 0).toFixed(2)} ha`, tone: 'blue' },
              ...(['PLANTED', 'GROWING', 'HARVEST_READY', 'HARVESTED'] as const).map((status) => ({
                label: status.replace('_', ' '),
                value: fields.filter((f) => f.growthStatus === status).length,
                tone: status === 'HARVEST_READY' ? 'yellow' as const : 'gray' as const,
              })),
            ]}
          />
        </SectionPanel>
      </div>

      <SectionPanel title="All Fields" subtitle="Searchable field inventory with responsive actions">
        <ResponsiveTable
          rows={filteredFields.slice((page - 1) * pageSize, page * pageSize)}
          getRowKey={(field) => field.id}
          emptyState={
            <EmptyState
              title={fields.length === 0 ? 'No fields yet' : 'No fields match the filters'}
              description={
                fields.length === 0
                  ? 'Create your first plantation field to start tracking weather, sensor, and NDVI data.'
                  : 'Adjust search or filter criteria to see more fields.'
              }
              action={
                fields.length === 0 && !isReadOnly ? (
                  <Button onClick={() => handleOpenModal()} leftIcon={<Plus size={18} />}>
                    Add Field
                  </Button>
                ) : undefined
              }
            />
          }
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (field) => <span className="font-medium text-gray-900">{field.name}</span>,
            },
            {
              key: 'area',
              header: 'Area',
              render: (field) => `${field.areaHectares} ha`,
            },
            {
              key: 'variety',
              header: 'Variety',
              render: (field) => field.sugarcaneVariety,
            },
            {
              key: 'cropAge',
              header: 'Crop Age',
              render: (field) => `${field.cropAgeDays || 0} days`,
            },
            {
              key: 'status',
              header: 'Status',
              render: (field) => (
                <Badge variant={field.growthStatus === 'HARVEST_READY' ? 'success' : 'info'}>
                  {field.growthStatus}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (field) => (
                <div className="flex justify-end gap-2 md:justify-start">
                  <IconButton
                    label={`View ${field.name}`}
                    onClick={() => navigate(`/fields/${field.id}`)}
                    variant="primary"
                  >
                    <Eye size={18} />
                  </IconButton>
                  {!isReadOnly && (
                    <>
                      <IconButton
                        label={`Edit ${field.name}`}
                        onClick={() => handleOpenModal(field)}
                        variant="secondary"
                      >
                        <Edit size={18} />
                      </IconButton>
                      <IconButton
                        label={`Delete ${field.name}`}
                        onClick={() => setFieldToDelete(field)}
                        variant="danger"
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
        <PaginationControls
          page={page}
          totalPages={Math.max(Math.ceil(filteredFields.length / pageSize), 1)}
          totalItems={filteredFields.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </SectionPanel>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingField ? 'Edit Field' : 'Create New Field'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingField ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Field Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4">
            <Input
              label="Latitude"
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              required
            />
            <Input
            label="Longitude"
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              required
            />
          </div>
          <Input
            label="Location Name"
            value={formData.locationName}
            onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
            placeholder="Village, district, city"
            helperText="Used to make field location easier to read than coordinates alone."
          />
          <Input
            label="Area (hectares)"
            type="number"
            step="0.1"
            value={formData.areaHectares}
            onChange={(e) => setFormData({ ...formData, areaHectares: e.target.value })}
            required
          />
          <Input
            label="Sugarcane Variety"
            value={formData.sugarcaneVariety}
            onChange={(e) => setFormData({ ...formData, sugarcaneVariety: e.target.value })}
            required
          />
          <Input
            label="Planting Date"
            type="date"
            value={formData.plantingDate}
            onChange={(e) => setFormData({ ...formData, plantingDate: e.target.value })}
            required
          />
          <Select
            label="Growth Status"
            value={formData.growthStatus}
            onChange={(e) => setFormData({ ...formData, growthStatus: e.target.value as GrowthStatus })}
            options={[
              { value: GrowthStatus.PLANTED, label: 'Planted' },
              { value: GrowthStatus.GROWING, label: 'Growing' },
              { value: GrowthStatus.HARVEST_READY, label: 'Harvest Ready' },
              { value: GrowthStatus.HARVESTED, label: 'Harvested' },
            ]}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!fieldToDelete}
        title="Delete field"
        description={`Delete ${fieldToDelete?.name || 'this field'}? This also removes related monitoring history for that field.`}
        confirmLabel="Delete field"
        onConfirm={handleConfirmDelete}
        onClose={() => setFieldToDelete(null)}
      />
    </Layout>
  );
};
