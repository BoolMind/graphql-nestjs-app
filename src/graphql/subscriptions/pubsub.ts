import { PubSub } from 'graphql-subscriptions';

export const PUBSUB = Symbol('PUBSUB');

export const pubSub = new PubSub();

export const PUBSUB_EVENTS = {
  USER_CREATED: 'USER_CREATED',
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  ORDER_CREATED: 'ORDER_CREATED',
} as const;
