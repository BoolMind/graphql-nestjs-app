import { CustomScalar, Scalar } from '@nestjs/graphql';
import { GraphQLError, Kind, ValueNode } from 'graphql';

@Scalar('DateTime')
export class DateTimeScalar implements CustomScalar<string, Date> {
  description = 'ISO-8601 DateTime custom scalar';

  private parseDateTime(value: unknown): Date {
    if (typeof value !== 'string') {
      throw new GraphQLError('DateTime must be an ISO-8601 string');
    }

    const iso8601Pattern =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

    if (!iso8601Pattern.test(value)) {
      throw new GraphQLError(
        'DateTime must be a valid ISO-8601 date-time with a timezone',
      );
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new GraphQLError('Invalid DateTime value');
    }

    return date;
  }

  parseValue(value: unknown): Date {
    return this.parseDateTime(value);
  }

  serialize(value: unknown): string {
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        throw new GraphQLError('Invalid DateTime value');
      }

      return value.toISOString();
    }

    return this.parseDateTime(value).toISOString();
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError('DateTime must be an ISO-8601 date-time string');
    }

    return this.parseDateTime(ast.value);
  }
}
