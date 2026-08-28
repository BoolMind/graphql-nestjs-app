import { SortOrder } from './sorting.types';

export interface ListArgs<TSortField extends string = string> {
  page?: number;
  limit?: number;
  sortBy?: TSortField;
  sortOrder?: SortOrder;
  search?: string;
}
