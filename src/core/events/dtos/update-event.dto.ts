import { EventStatus } from "../../../utils/event.status";
import { ICreateEventDto } from "./create-event.dto";

export interface IUpdateEventDto extends Partial<ICreateEventDto> {
  status: EventStatus;
}
