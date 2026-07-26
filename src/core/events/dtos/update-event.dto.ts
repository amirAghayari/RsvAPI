import { EventStatus } from "../event.status";
import { ICreateEventDto } from "./create-event.dto";

export type IUpdateEventDto = Partial<
  Omit<ICreateEventDto, "userId"> & {
    status?: EventStatus;
  }
>;
