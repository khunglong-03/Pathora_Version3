"use client";

import React, { useCallback, useEffect, useState } from "react";
import { adminService } from "@/api/services/adminService";
import type { AdminUserListItem, PaginatedList } from "@/api/services/adminService";
import {
  AdminPageHeader,
  AdminEmptyState,
  AdminErrorCard,
} from "@/features/dashboard/components";
import { AdminUserTable } from "@/features/dashboard/components/AdminUserTable";

export default function AdminTourDesignersPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = {
      page: currentPage,
      limit: 10,
      role: "TourDesigner",
    };

    const result = await adminService.getAllUsers(params);

    if (result && typeof result === "object" && "items" in result) {
      const data = result as PaginatedList<AdminUserListItem>;
      setUsers(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } else if (!result) {
      setUsers([]);
    }
    setIsLoading(false);
  }, [currentPage]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers, reloadToken]);

  const handleRefresh = () => {
    setReloadToken((t) => t + 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Quản lý Tour Designer"
        subtitle="Danh sách tài khoản Tour Designer"
        onRefresh={handleRefresh}
      />

      {error && <AdminErrorCard message={error} onRetry={handleRefresh} />}

      {!error && !isLoading && users.length === 0 && (
        <AdminEmptyState
          icon="PaintBrush"
          heading="Không có Tour Designer nào"
          description="Chưa có tài khoản Tour Designer nào trong hệ thống."
        />
      )}

      {!error && !isLoading && users.length > 0 && (
        <AdminUserTable
          users={users}
          isLoading={false}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={handlePageChange}
        />
      )}

      {isLoading && (
        <AdminUserTable users={[]} isLoading={true} onPageChange={() => {}} />
      )}
    </div>
  );
}
