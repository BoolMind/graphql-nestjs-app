import { Global, Module } from '@nestjs/common';

import { PUBSUB, pubSub } from './pubsub';

@Global()
@Module({
  providers: [
    {
      provide: PUBSUB,
      useValue: pubSub,
    },
  ],

  exports: [PUBSUB],
})
export class PubSubModule {}
