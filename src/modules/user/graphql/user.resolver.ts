import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import { User } from '../entities/user.entity';
import type { UserListArgs } from '../user.types';
import { CreateUserInput, UpdateUserInput } from './inputs';
import { UserService } from '../user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query('users')
  async users(
    @Args('page', {
      type: () => Int,
      nullable: true,
      defaultValue: 1,
    })
    page: number,

    @Args('limit', {
      type: () => Int,
      nullable: true,
      defaultValue: 20,
    })
    limit: number,

    @Args('sortBy', { nullable: true })
    sortBy: UserListArgs['sortBy'],

    @Args('sortOrder', { nullable: true })
    sortOrder: UserListArgs['sortOrder'],

    @Args('search', { nullable: true })
    search?: string,
  ) {
    return this.userService.findAll({
      page,
      limit,
      sortBy,
      sortOrder,
      search,
    });
  }

  @Query('user')
  async user(
    @Args('id', { type: () => ID })
    id: string,
  ) {
    return this.userService.findById(id);
  }

  @Mutation('createUser')
  async createUser(
    @Args('input')
    input: CreateUserInput,
  ) {
    return this.userService.create(input);
  }

  @Mutation('updateUser')
  async updateUser(
    @Args('id', { type: () => ID })
    id: string,

    @Args('input')
    input: UpdateUserInput,
  ) {
    return this.userService.update(id, input);
  }

  @Mutation('deleteUser')
  async deleteUser(
    @Args('id', { type: () => ID })
    id: string,
  ) {
    return this.userService.delete(id);
  }
}
