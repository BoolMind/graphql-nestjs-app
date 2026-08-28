import {
  Brackets,
  DeepPartial,
  EntityManager,
  FindOneOptions,
  FindOptionsRelations,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

import { NotFoundException } from '../../exceptions';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
} from '../../constants';
import {
  ListArgs,
  PaginatedResult,
} from '../../types';

export abstract class BaseService<
  TEntity extends ObjectLiteral,
  TCreateInput,
  TUpdateInput,
> {
  protected constructor(
    protected readonly repository: Repository<TEntity>,
  ) {}

  protected get alias(): string {
    return this.repository.metadata.tableName;
  }

  protected entityLabel(): string {
    return this.repository.metadata.targetName;
  }

  protected relations(): FindOptionsRelations<TEntity> {
    return {};
  }

  protected searchableFields(): string[] {
    return [];
  }

  protected sortFieldMap(): Record<string, string> {
    return {};
  }

  protected defaultSortField(): string {
    return 'createdAt';
  }

  protected applyFilters(
    _queryBuilder: SelectQueryBuilder<TEntity>,
    _alias: string,
    _args: ListArgs,
  ): void {}

  protected repositoryFor(manager?: EntityManager): Repository<TEntity> {
    return manager
      ? manager.getRepository(this.repository.target)
      : this.repository;
  }

  protected async findOne(
    options: FindOneOptions<TEntity>,
    manager?: EntityManager,
  ): Promise<TEntity | null> {
    return this.repositoryFor(manager).findOne(options);
  }

  async findAll(
    args: ListArgs = {},
  ): Promise<PaginatedResult<TEntity>> {
    const page = Math.max(
      DEFAULT_PAGE,
      Math.trunc(args.page ?? DEFAULT_PAGE),
    );

    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Math.trunc(args.limit ?? DEFAULT_LIMIT)),
    );

    const alias = this.alias;
    const qb = this.repository.createQueryBuilder(alias);

    const relations = this.relations();

    for (const relation of Object.keys(relations)) {
      qb.leftJoinAndSelect(
        `${alias}.${relation}`,
        relation,
      );
    }

    this.applyFilters(qb, alias, args);

    const search = args.search?.trim();
    const searchableFields = this.searchableFields();

    if (search && searchableFields.length > 0) {
      qb.andWhere(
        new Brackets((subQuery) => {
          searchableFields.forEach((field, index) => {
            const clause = `${alias}.${field} LIKE :search`;

            if (index === 0) {
              subQuery.where(clause, {
                search: `%${search}%`,
              });
            } else {
              subQuery.orWhere(clause, {
                search: `%${search}%`,
              });
            }
          });
        }),
      );
    }

    const sortField =
      (args.sortBy &&
        this.sortFieldMap()[args.sortBy]) ||
      this.defaultSortField();

    qb.orderBy(
      `${alias}.${sortField}`,
      args.sortOrder ?? 'DESC',
    );

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    const totalPages =
      total === 0 ? 0 : Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<TEntity> {
    const entity = await this.repositoryFor(manager).findOne({
      where: { id } as any,
      relations: this.relations(),
    });

    if (!entity) {
      throw new NotFoundException(
        `${this.entityLabel()} with id "${id}" was not found`,
      );
    }

    return entity;
  }

  async create(data: TCreateInput): Promise<TEntity> {
    const entity = this.repository.create(
      data as DeepPartial<TEntity>,
    );

    return this.repository.save(entity);
  }

  async update(
    id: string,
    data: TUpdateInput,
  ): Promise<TEntity> {
    const entity = await this.findById(id);

    Object.assign(entity, data);

    return this.repository.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const entity = await this.findById(id);

    await this.repository.remove(entity);

    return true;
  }
}
