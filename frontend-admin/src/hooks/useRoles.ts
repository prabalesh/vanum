import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { rolesApi } from '../services/api';
import type { Role, RoleFormData } from '../types';

export const useRoles = (limit = 10) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRoles, setTotalRoles] = useState(0);

  // Fetch roles
  const fetchRoles = async (page = 1) => {
    try {
      setLoading(true);
      const response = await rolesApi.getAll(page, limit);
      if (response.success) {
        setRoles(response.data);
        setCurrentPage(response.pagination.page);
        setTotalPages(response.pagination.total_pages);
        setTotalRoles(response.pagination.total);
      }
    } catch (error) {
      toast.error('Failed to fetch roles');
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles(currentPage);
  }, [currentPage]);

  // Create role
  const createRole = async (data: RoleFormData) => {
    try {
      const response = await rolesApi.create(data);
      if (response.success) {
        toast.success('Role created successfully');
        fetchRoles(currentPage);
        return true;
      }
    } catch (error) {
      toast.error('Failed to create role');
      console.error('Error creating role:', error);
    }
    return false;
  };

  // Update role
  const updateRole = async (id: number, data: RoleFormData) => {
    try {
      const response = await rolesApi.update(id, data);
      if (response.success) {
        toast.success('Role updated successfully');
        fetchRoles(currentPage);
        return true;
      }
    } catch (error) {
      toast.error('Failed to update role');
      console.error('Error updating role:', error);
    }
    return false;
  };

  // Delete role
  const deleteRole = async (id: number) => {
    try {
      const response = await rolesApi.delete(id);
      if (response.success) {
        toast.success('Role deleted successfully');
        fetchRoles(currentPage);
        return true;
      }
    } catch (error) {
      toast.error('Failed to delete role');
      console.error('Error deleting role:', error);
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
  const endIndex = Math.min(currentPage * limit, totalRoles);

  return {
    roles,
    loading,
    currentPage,
    totalPages,
    totalRoles,
    startIndex,
    endIndex,
    createRole,
    updateRole,
    deleteRole,
    handlePageChange,
  };
};
