import { ICreateTicketDto } from "./create-ticket.dto";

export type IUpdateTicketDto = Partial<Omit<ICreateTicketDto, "eventId">>;
