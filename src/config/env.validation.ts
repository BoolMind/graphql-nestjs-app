import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  APP_NAME: Joi.string().trim().min(1).default('graphql-nestjs'),

  APP_PORT: Joi.number().port().default(3000),

  DB_HOST: Joi.string().trim().min(1).required(),

  DB_PORT: Joi.number().port().default(3306),

  DB_USERNAME: Joi.string().trim().min(1).required(),

  DB_PASSWORD: Joi.string().allow('').required(),

  DB_NAME: Joi.string().trim().min(1).required(),

  DB_SYNCHRONIZE: Joi.boolean().default(false),

  DB_LOGGING: Joi.boolean().default(false),

  GRAPHQL_PATH: Joi.string()
    .trim()
    .pattern(/^\/[a-zA-Z0-9/_-]*$/)
    .default('/graphql'),

  GRAPHQL_GRAPHIQL: Joi.boolean().default(false),

  CORS_ORIGINS: Joi.string().allow('').default(''),

  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'log', 'debug', 'verbose')
    .default('log'),
});
