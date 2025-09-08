import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { usersApi, rolesApi } from '../services/api';
import type { GeneralUser, CreateUserFormData, UpdateUserFormData, Role } from '../types';

export const useUsers = (limit = 10) => {
  const [users, setUsers] = useState<GeneralUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Fetch users
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await usersApi.getAll(page, limit);
      if (response.success) {
        setUsers(response.data);
        setCurrentPage(response.pagination.page);
        setTotalPages(response.pagination.total_pages);
        setTotalUsers(response.pagination.total);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const response = await rolesApi.getAll();
      if (response.success) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
    fetchRoles();
  }, [currentPage]);

  // Create user
  const createUser = async (data: CreateUserFormData) => {
    try {
      const response = await usersApi.create(data);
      if (response.success) {
        toast.success('User created successfully');
        fetchUsers(currentPage);
        return true;
      }
    } catch (error) {
      toast.error('Failed to create user');
      console.error('Error creating user:', error);
    }
    return false;
  };

  // Update user
  const updateUser = async (id: number, data: UpdateUserFormData) => {
    try {
      const response = await usersApi.update(id, data);
      if (response.success) {
        toast.success('User updated successfully');
        fetchUsers(currentPage);
        return true;
      }
    } catch (error) {
      toast.error('Failed to update user');
      console.error('Error updating user:', error);
    }
    return false;
  };

  // Delete user
  const deleteUser = async (id: number) => {
    try {
      const response = await usersApi.delete(id);
      if (response.success) {
        toast.success('User deleted successfully');
        fetchUsers(currentPage);
        return true;
      }
    } catch (error) {
      toast.error('Failed to delete user');
      console.error('Error deleting user:', error);
    }
    return false;
  };

  // Toggle user status
  const toggleUserStatus = async (user: GeneralUser) => {
    try {
      const updateData: UpdateUserFormData = { is_active: !user.is_active };
      const response = await usersApi.update(user.id, updateData);
      if (response.success) {
        toast.success(`User ${!user.is_active ? 'activated' : 'deactivated'} successfully`);
        fetchUsers(currentPage);
        return true;
      }
    } catch (error) {
      toast.error('Failed to update user status');
      console.error('Error updating user status:', error);
    }
    return false;
  };

  // Pagination handler
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const startIndex = (currentPage - 1) * limit + 1;
  const endIndex = Math.min(currentPage * limit, totalUsers);

  return {
    users,
    roles,
    loading,
    currentPage,
    totalPages,
    totalUsers,
    startIndex,
    endIndex,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    handlePageChange,
  };
};
