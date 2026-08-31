import {
  DeepPartial,
  FindOneOptions,
  FindOptionsRelations,
  FindOptionsWhere,
  Repository,
} from 'typeorm';

import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../../constants';

import { ListArgs, PaginatedResult } from '../../types';

import { ConflictException, NotFoundException } from '../../exceptions';

export abstract class BaseService<
  TEntity extends { id: string; version: number },
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

      relations: this.relations(),
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
        queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
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
    const expectedVersion = (entity as TEntity & { version: number }).version;

    const updateData = {
      ...(input as Record<string, unknown>),
      version: () => 'version + 1',
    };

    const result = await this.repository
      .createQueryBuilder()
      .update()
      .set(updateData as any)
      .where('id = :id', { id })
      .andWhere('version = :version', { version: expectedVersion })
      .execute();

    if (result.affected !== 1) {
      throw new ConflictException(
        `${this.entityName()} was modified by another request. Please retry.`,
      );
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const entity = await this.findById(id);

    await this.repository.remove(entity);

    return true;
  }
}
