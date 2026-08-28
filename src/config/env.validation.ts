import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  APP_NAME: Joi.string().trim().min(1).default('graphql-nestjs'),

  APP_PORT: Joi.number().port().default(3000),

  DB_HOST: Joi.string().trim().min(1).required(),

  DB_PORT: Joi.number().port().default(5432),

  DB_USERNAME: Joi.string().trim().min(1).required(),

  DB_PASSWORD: Joi.string().allow('').required(),

  DB_NAME: Joi.string().trim().min(1).required(),

  GRAPHQL_PATH: Joi.string().trim().min(1).default('/graphql'),

  GRAPHQL_PLAYGROUND: Joi.boolean().default(false),

  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'log', 'debug', 'verbose')
    .default('debug'),
});
