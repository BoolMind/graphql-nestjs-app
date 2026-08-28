import {
  DeepPartial,
  FindOneOptions,
  FindOptionsRelations,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../../constants';

import { ListArgs, PaginatedResult } from '../../types';

import { NotFoundException } from '../../exceptions';

export abstract class BaseService<
  TEntity extends { id: string },
  TCreateInput extends DeepPartial<TEntity> = DeepPartial<TEntity>,
  TUpdateInput extends DeepPartial<TEntity> = DeepPartial<TEntity>,
  TListArgs extends ListArgs = ListArgs,
> {
  protected constructor(protected readonly repository: Repository<TEntity>) {}

  protected searchableFields(): string[] {
    return [];
  }

  protected sortFieldMap(): Record<string, string> {
    return {};
  }

  protected relations(): FindOptionsRelations<TEntity> {
    return {};
  }

  protected applyFilters(
    _queryBuilder: ReturnType<Repository<TEntity>['createQueryBuilder']>,
    _alias: string,
    _args: ListArgs,
  ): void {}

  protected entityName(): string {
    return this.repository.metadata.name;
  }

  async findById(id: string): Promise<TEntity> {
    const entity = await this.repository.findOne({
      where: { id } as FindOptionsWhere<TEntity>,
    });

    if (!entity) {
      throw new NotFoundException(`${this.entityName()} not found`);
    }

    return entity;
  }

  async findOne(options: FindOneOptions<TEntity>): Promise<TEntity | null> {
    return this.repository.findOne(options);
  }

  async findAll(
    args: TListArgs = {} as TListArgs,
  ): Promise<PaginatedResult<TEntity>> {
    const rawPage = Number(args.page ?? DEFAULT_PAGE);

    const rawLimit = Number(args.limit ?? DEFAULT_LIMIT);

    const page = Number.isFinite(rawPage)
      ? Math.max(DEFAULT_PAGE, Math.floor(rawPage))
      : DEFAULT_PAGE;

    const limit = Number.isFinite(rawLimit)
      ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(rawLimit)))
      : DEFAULT_LIMIT;

    const skip = (page - 1) * limit;

    const sortMap = this.sortFieldMap();

    const sortColumn =
      args.sortBy && sortMap[args.sortBy]
        ? sortMap[args.sortBy]
        : (sortMap.CREATED_AT ?? 'createdAt');

    const sortOrder = args.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const queryBuilder = this.repository.createQueryBuilder('entity');

    const relations = this.relations();

    for (const [relation, enabled] of Object.entries(relations)) {
      if (enabled === true) {
        queryBuilder.leftJoinAndSelect(
          `entity.${relation}`,
          relation,
        );
      }
    }

    this.applyFilters(queryBuilder, 'entity', args);

    if (args.search?.trim()) {
      const fields = this.searchableFields();

      if (fields.length > 0) {
        const search = `%${args.search.trim()}%`;

        queryBuilder.andWhere(
          fields.map((field) => `entity.${field} LIKE :search`).join(' OR '),
          { search },
        );
      }
    }

    queryBuilder
      .orderBy(`entity.${sortColumn}`, sortOrder)
      .skip(skip)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && totalPages > 0,
    };
  }

  async create(input: TCreateInput): Promise<TEntity> {
    const entity = this.repository.create(input);

    return this.repository.save(entity);
  }

  async update(id: string, input: TUpdateInput): Promise<TEntity> {
    const entity = await this.findById(id);

    this.repository.merge(entity, input as DeepPartial<TEntity>);

    return this.repository.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const entity = await this.findById(id);

    await this.repository.remove(entity);

    return true;
  }
}
