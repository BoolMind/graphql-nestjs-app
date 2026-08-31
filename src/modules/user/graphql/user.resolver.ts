import { Inject } from '@nestjs/common';
import {
  Args,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';

import { User } from '../entities/user.entity';
import { UserService } from '../user.service';
import type { UserListArgs } from '../user.types';
import { CreateUserInput, UpdateUserInput } from './inputs';

import { PUBSUB, PUBSUB_EVENTS } from '../../../graphql/subscriptions/pubsub';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    @Inject(PUBSUB)
    private readonly pubSub: PubSub,
  ) {}

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
    const user = await this.userService.create(input);

    await this.pubSub.publish(PUBSUB_EVENTS.USER_CREATED, {
      userCreated: user,
    });

    return user;
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

  @Subscription('userCreated')
  userCreated() {
    return this.pubSub.asyncIterableIterator(PUBSUB_EVENTS.USER_CREATED);
  }
}
