import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
    const existing = await this.findOne({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictException(
        `A user with email "${input.email}" already exists`,
      );
    }

    return super.create(input);
  }

  async update(id: string, input: UpdateUserData): Promise<User> {
    const user = await this.findById(id);

    if (input.email && input.email !== user.email) {
      const existing = await this.findOne({
        where: { email: input.email },
      });

      if (existing && existing.id !== user.id) {
        throw new ConflictException(
          `A user with email "${input.email}" already exists`,
        );
      }
    }

    return super.update(id, input);
  }
}
