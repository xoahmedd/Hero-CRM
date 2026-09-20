export interface Customer {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CustomerRequest {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  status: string;
  notes?: string | null;
}

export interface CustomerPagedResponse {
  items: Customer[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
