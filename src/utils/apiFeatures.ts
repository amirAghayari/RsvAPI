import {
  FindManyOptions,
  FindOptionsWhere,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  ObjectLiteral,
  Repository,
} from "typeorm";

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
      where: initialFilter || ({} as FindOptionsWhere<T>),
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
}
