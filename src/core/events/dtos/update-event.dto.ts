import { ICreateEventDto } from "./create-event.dto";

export interface IUpdateEventDto extends Partial<ICreateEventDto> {}
