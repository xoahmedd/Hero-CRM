import api from "../api/axios";

import type {
  Customer,
  CustomerPagedResponse,
  CustomerRequest,
} from "../types/customer";

export async function getCustomers(): Promise<Customer[]> {
  const response = await api.get<Customer[]>("/Customers");
  return response.data;
}

export async function getCustomer(id: number): Promise<Customer> {
  const response = await api.get<Customer>(`/Customers/${id}`);
  return response.data;
}

export async function getCustomersPaged(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<CustomerPagedResponse> {
  const response = await api.get<CustomerPagedResponse>(
    "/Customers/paged",
    { params }
  );

  return response.data;
}

export async function createCustomer(
  data: CustomerRequest
): Promise<Customer> {
  const response = await api.post<Customer>("/Customers", data);
  return response.data;
}

export async function updateCustomer(
  id: number,
  data: CustomerRequest
): Promise<void> {
  await api.put(`/Customers/${id}`, data);
}

export async function deleteCustomer(id: number): Promise<void> {
  await api.delete(`/Customers/${id}`);
}
