import React, { useEffect, useState } from 'react';
import { Layout } from '../components/common/Layout';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  IconButton,
  Input,
  MetricStrip,
  Modal,
  PageHeader,
  ResponsiveTable,
  SectionPanel,
  Select,
  Spinner,
} from '../components/common';
import { userService } from '../services/user.service';
import { User, Role } from '../types';
import { Plus, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';

export const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: Role.TECHNICIAN,
    isActive: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (error) {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: Role.TECHNICIAN,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    setError('');

    try {
      if (editingUser) {
        const updateData: any = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          isActive: formData.isActive,
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        await userService.update(editingUser.id, updateData);
        setSuccess('User updated successfully');
      } else {
        if (!formData.password) {
          setError('Password is required for new users');
          return;
        }

        await userService.create({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          isActive: formData.isActive,
        });
        setSuccess('User created successfully');
      }

      setIsModalOpen(false);
      loadUsers();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await userService.delete(userToDelete.id);
      setSuccess('User deleted successfully');
      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      setError('Failed to delete user');
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

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'danger';
      case 'MANAGER': return 'warning';
      case 'AGRONOMIST': return 'success';
      default: return 'info';
    }
  };

  return (
    <Layout>
      <PageHeader
        title="User Management"
        description="Manage system users and their roles"
        actions={
          <Button onClick={() => handleOpenModal()}>
            <Plus size={20} className="mr-2" />
            Add User
          </Button>
        }
      />

      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

      <MetricStrip
        className="mb-6"
        items={[
          { label: 'Total Users', value: users.length, tone: 'blue' },
          { label: 'Admins', value: users.filter((u) => u.role === 'ADMIN').length, tone: 'red' },
          { label: 'Managers', value: users.filter((u) => u.role === 'MANAGER').length, tone: 'yellow' },
          { label: 'Agronomists', value: users.filter((u) => u.role === 'AGRONOMIST').length, tone: 'green' },
        ]}
      />

      <SectionPanel title="All Users" subtitle="Role, status, and account management">
        <ResponsiveTable
          rows={users}
          getRowKey={(user) => user.id}
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (user) => (
                <span className="font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </span>
              ),
            },
            {
              key: 'email',
              header: 'Email',
              render: (user) => user.email,
            },
            {
              key: 'role',
              header: 'Role',
              render: (user) => (
                <Badge variant={getRoleBadgeVariant(user.role) as any}>
                  {user.role}
                </Badge>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (user) =>
                user.isActive ? (
                  <div className="flex items-center justify-end text-green-600 md:justify-start">
                    <UserCheck size={18} className="mr-1" />
                    <span className="text-sm">Active</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-end text-red-600 md:justify-start">
                    <UserX size={18} className="mr-1" />
                    <span className="text-sm">Inactive</span>
                  </div>
                ),
            },
            {
              key: 'created',
              header: 'Created',
              render: (user) => format(new Date(user.createdAt), 'MMM dd, yyyy'),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (user) => (
                <div className="flex justify-end gap-2 md:justify-start">
                  <IconButton
                    label={`Edit ${user.firstName} ${user.lastName}`}
                    onClick={() => handleOpenModal(user)}
                    variant="secondary"
                  >
                    <Edit size={18} />
                  </IconButton>
                  <IconButton
                    label={
                      currentUser?.id === user.id
                        ? 'You cannot delete your own account'
                        : `Delete ${user.firstName} ${user.lastName}`
                    }
                    onClick={() => setUserToDelete(user)}
                    variant="danger"
                    disabled={currentUser?.id === user.id}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </div>
              ),
            },
          ]}
        />
      </SectionPanel>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Create New User'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <Input
          label={editingUser ? 'Password (leave empty to keep current)' : 'Password'}
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required={!editingUser}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
        <Select
          label="Role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
          options={[
            { value: Role.ADMIN, label: 'Admin' },
            { value: Role.MANAGER, label: 'Manager' },
            { value: Role.AGRONOMIST, label: 'Agronomist' },
            { value: Role.DRONE_OPERATOR, label: 'Drone Operator' },
            { value: Role.TECHNICIAN, label: 'Technician' },
          ]}
        />
        <Select
          label="Account Status"
          value={formData.isActive ? 'active' : 'inactive'}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!userToDelete}
        title="Delete user"
        description={`Delete ${userToDelete?.firstName || 'this'} ${userToDelete?.lastName || 'user'}? This action removes the account from the system.`}
        confirmLabel="Delete user"
        onConfirm={handleConfirmDelete}
        onClose={() => setUserToDelete(null)}
      />
    </Layout>
  );
};
