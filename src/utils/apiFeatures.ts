import {
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  ObjectLiteral,
  Repository,
} from "typeorm";
import { th } from "zod/v4/locales";

export default class APIFeatures<T extends ObjectLiteral> {
  private readonly repository: Repository<T>;
  private readonly queryRequest: any;
  private options: FindManyOptions<T>;

  constructor(
    repository: Repository<T>,
    reqQuery: any,
    initialFilter?: FindOptionsWhere<T>,
  ) {
    this.repository = repository;
    this.queryRequest = reqQuery;
    this.options = {
      where: (initialFilter || {}) as FindOptionsWhere<T>,
    };
  }

  filter(): this {
    const queryObject = { ...this.queryRequest };
    const excludedFields = ["sort", "fields", "search", "page", "limit"];
    excludedFields.forEach((field) => delete queryObject[field]);

    const whereCondition: Record<string, any> = {
      ...(this.options.where as Record<string, any>),
    };
    for (const [key, value] of Object.entries(queryObject)) {
      if (typeof value === "object" && value !== null) {
        const operator = Object.keys(value)[0];
        const val = (value as any)[operator];
        switch (operator) {
          case "gte":
            whereCondition[key] = MoreThanOrEqual(val) as any;
            break;
          case "gt":
            whereCondition[key] = MoreThan(val) as any;
            break;
          case "lte":
            whereCondition[key] = LessThanOrEqual(val) as any;
            break;
          case "lt":
            whereCondition[key] = LessThan(val) as any;
            break;
          default:
            whereCondition[key] = val;
        }
      } else {
        whereCondition[key] = value;
      }
    }

    this.options.where = whereCondition as FindOptionsWhere<T>;
    return this;
  }

  search(): this {
    if (this.queryRequest.sort) {
      const where = (this.options.where as Record<string, any>) || {};
      where.name = ILike(`%${this.queryRequest.search}%`);
      this.options.where = where as unknown as FindOptionsWhere<T>;
    }
    return this;
  }

  sort(): this {
    if (this.queryRequest.sort) {
      const sortFields = this.queryRequest.sort.split(",");
      const order: any = {};

      for (const field of sortFields) {
        const direction = field.startsWith("-") ? "DESC" : "ASC";
        const fieldName = field.replace(/^-/, "");
        order[fieldName] = direction;
      }
      this.options.order = order;
    } else {
      this.options.order = { createdAt: "DESC" };
    }
    return this;
  }

  limitFields(): this {
    if (this.queryRequest.fields) {
      const fields = this.queryRequest.fields.split(".");
      this.options.select = fields as any;
    }
    return this;
  }

  async pagination() {
    const countOptions: FindManyOptions<T> = { ...this.options };
    delete countOptions.skip;
    delete countOptions.take;
    const total = await this.repository.count(countOptions);

    const limit = parseInt(this.queryRequest.limit) || 8;
    const page = parseInt(this.queryRequest.page) || 1;
    const skip = (page - 1) * limit;
    const pages = Math.ceil(total / limit);

    if (this.queryRequest.page) {
      this.options.skip = skip;
      this.options.take = limit;
    }

    const pagination = this.queryRequest.page
      ? { total, limit, pages, page, skip }
      : null;

    return { pagination, total, skip };
  }

  async execute(): Promise<T[]> {
    return await this.repository.find(this.options);
  }
}
