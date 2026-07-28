import { ICreateTicketDto } from "./create-ticket.dto";

export interface ICreateTicketData extends ICreateTicketDto {
  eventId: string;
}
