import { DataSource, EntityManager } from "typeorm";
import APIFeatures from "../../utils/apiFeatures";
import { NotFoundError } from "../../errors/not-found-error";
import { Ticket } from "./ticket.entity";

import { IUpdateTicketDto } from "./dtos/update-ticket.dto";
import { ICreateTicketData } from "./dtos/create-ticket-data.dto";

export class TicketRepository {
  constructor(private readonly dataSource: DataSource) {}

  private repo(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(Ticket);
  }

  async saveTicket(ticket: Ticket, manager?: EntityManager): Promise<Ticket> {
    return await this.repo(manager).save(ticket);
  }

  /********************************************************
   ************* @description READ OPERATIONS *************
   ********************************************************/

  async findAll(query: any, manager?: EntityManager) {
    const features = new APIFeatures<Ticket>(this.repo(manager), query);

    features.filter().sort().search().limitFields();

    const { pagination, skip, total } = await features.pagination();

    const tickets = await features.execute();

    return {
      pagination,
      skip,
      total,
      tickets,
    };
  }

  async findById(
    id: string,
    option?: {
      select?: (keyof Ticket)[];
      relations?: string[];
      order?: string[];
    },
    manager?: EntityManager,
  ): Promise<Ticket | null> {
    const { select, relations, order } = option || {};

    const queryOptions: any = {
      where: { id },
    };

    if (select?.length) queryOptions.select = select;
    if (relations?.length) queryOptions.relations = relations;
    if (order) queryOptions.order = order;

    return await this.repo(manager).findOne(queryOptions);
  }

  async findByEventId(
    eventId: string,
    manager?: EntityManager,
  ): Promise<Ticket[]> {
    return await this.repo(manager).find({
      where: { eventId },
    });
  }

  async findByIdForUpdate(
    id: string,
    manager: EntityManager,
  ): Promise<Ticket | null> {
    return manager
      .getRepository(Ticket)
      .createQueryBuilder("ticket")
      .setLock("pessimistic_write")
      .where("ticket.id = :id", { id })
      .getOne();
  }

  /*************************************************************
   ************* @description CREATE OPERATIONS ****************
   *************************************************************/

  async createTicket(
    createTicketDto: ICreateTicketData,
    manager?: EntityManager,
  ): Promise<Ticket> {
    const newTicket = this.repo(manager).create(createTicketDto);

    return await this.saveTicket(newTicket, manager);
  }

  /************************************************************
   ************* @description UPDATE OPERATIONS ***************
   ************************************************************/

  async updateTicket(
    id: string,
    payload: IUpdateTicketDto,
    manager?: EntityManager,
  ): Promise<Ticket | null> {
    const result = await this.repo(manager).update(id, payload);

    if (result.affected === 0) {
      throw new NotFoundError(`Ticket with id ${id} not found`);
    }

    const updatedTicket = await this.findById(id, undefined, manager);

    if (!updatedTicket) {
      throw new NotFoundError(`Ticket with id ${id} not found after update`);
    }

    return updatedTicket;
  }

  /************************************************************
   ************* @description DELETE OPERATIONS ***************
   ************************************************************/

  async deleteTicket(
    id: string,
    manager?: EntityManager,
  ): Promise<{ success: boolean; message: string }> {
    const ticket = await this.findById(id, undefined, manager);

    if (!ticket) {
      throw new NotFoundError(`Ticket with id ${id} not found`);
    }

    await this.repo(manager).remove(ticket);

    return {
      success: true,
      message: `Ticket with id ${id} deleted successfully`,
    };
  }
}
