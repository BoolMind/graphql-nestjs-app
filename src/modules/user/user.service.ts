import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { BaseService, ConflictException } from '../../common';

import { User } from './entities/user.entity';
import { CreateUserData, UpdateUserData, UserSortField } from './user.types';

const SORT_FIELD_MAP: Record<UserSortField, string> = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  NAME: 'name',
  EMAIL: 'email',
};

@Injectable()
export class UserService extends BaseService<
  User,
  CreateUserData,
  UpdateUserData
> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
  ) {
    super(repository);
  }

  protected override searchableFields(): string[] {
    return ['name', 'email'];
  }

  protected override sortFieldMap(): Record<string, string> {
    return SORT_FIELD_MAP;
  }

  async create(input: CreateUserData): Promise<User> {
    const data = input;

    const existing = await this.findOne({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException(
        `A user with email "${data.email}" already exists`,
      );
    }

    try {
      return await super.create(data);
    } catch (error) {
      if (this.isDuplicateEmailError(error)) {
        throw new ConflictException(
          `A user with email "${data.email}" already exists`,
        );
      }

      throw error;
    }
  }

  async update(id: string, input: UpdateUserData): Promise<User> {
    const data = input;

    const user = await this.findById(id);

    if (data.email && data.email !== user.email) {
      const existing = await this.findOne({
        where: { email: data.email },
      });

      if (existing && existing.id !== user.id) {
        throw new ConflictException(
          `A user with email "${data.email}" already exists`,
        );
      }
    }

    try {
      return await super.update(id, data);
    } catch (error) {
      if (data.email && this.isDuplicateEmailError(error)) {
        throw new ConflictException(
          `A user with email "${data.email}" already exists`,
        );
      }

      throw error;
    }
  }

  private isDuplicateEmailError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as {
      code?: string;
      errno?: number;
    };

    return driverError.code === 'ER_DUP_ENTRY' || driverError.errno === 1062;
  }
}
