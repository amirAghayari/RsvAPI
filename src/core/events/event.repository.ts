import { DataSource, EntityManager } from "typeorm";
import APIFeatures from "../../utils/apiFeatures";
import { Event } from "./event.entity";
import { ICreateEventDto } from "./dtos/create-event.dto";
import { NotFoundError } from "../../errors/not-found-error";
import { IUpdateEventDto } from "./dtos/update-event.dto";

export class EventRepository {
  constructor(private readonly dataSource: DataSource) {}

  private repo(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(Event);
  }

  async saveEvent(event: Event, manager?: EntityManager) {
    this.repo(manager).save(event);
  }

  /********************************************************
   ************* @description READ OPERATIONS *************
   ********************************************************/

  async findAll(query: any, manager?: EntityManager) {
    const features = new APIFeatures<Event>(this.repo(manager), query);

    features.filter().sort().search().limitFields();

    const { pagination, skip, total } = await features.pagination();

    const events = await features.execute();

    return { pagination, skip, total, events };
  }

  async findById(
    id: string,
    option?: {
      select?: (keyof Event)[];
      relations?: string[];
      order?: string[];
    },
    manager?: EntityManager,
  ): Promise<Event | null> {
    const { select, order, relations } = option || {};

    const queryOptions: any = {
      where: { id },
    };

    if (select && select.length) queryOptions.select = select;
    if (relations && relations.length) queryOptions.relations = relations;
    if (order && order.length) queryOptions.order = order;

    const event = await this.repo(manager).findOne(queryOptions);

    return event;
  }

  /*************************************************************
   ************* @description CREATE OPERATIONS ****************
   *************************************************************/

  async createEvent(
    createEventDto: ICreateEventDto,
    manager?: EntityManager,
  ): Promise<Event> {
    return this.repo(manager).create(createEventDto);
  }

  /************************************************************
   ************* @description UPDATE OPERATIONS ***************
   ************************************************************/
  async updateEvent(
    id: string,
    payload: IUpdateEventDto,
    manager?: EntityManager,
  ): Promise<Event | null> {
    const result = await this.repo(manager).update(id, payload);

    if (result.affected === 0) {
      throw new NotFoundError(`Event with id ${id} not found`);
    }
    const updatedEvent = await this.findById(id);
    if (!updatedEvent) {
      throw new NotFoundError(`Event with id ${id} not found after update`);
    }

    return updatedEvent;
  }

  /************************************************************
   ************* @description DELETE OPERATIONS ***************
   ************************************************************/
  async deleteEvent(
    id: string,
    manager?: EntityManager,
  ): Promise<{ success: boolean; message: string }> {
    const event = await this.repo(manager).findOne({ where: { id } });

    if (!event) {
      throw new NotFoundError(`Event with id ${id} not found`);
    }

    await this.repo(manager).remove(event);

    return {
      success: true,
      message: `Event with id ${id} deleted successfully`,
    };
  }
}
