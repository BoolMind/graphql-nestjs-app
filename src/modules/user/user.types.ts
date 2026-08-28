import type { ListArgs } from '../../common/types';

export type UserSortField = 'CREATED_AT' | 'UPDATED_AT' | 'NAME' | 'EMAIL';

export interface CreateUserData {
  name: string;
  email: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
}

export type UserListArgs = ListArgs<UserSortField>;
