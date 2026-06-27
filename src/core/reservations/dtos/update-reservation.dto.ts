import { ICreateReservationDto } from "./create-reservation.dto";

export interface IUpdateReservationDto extends Partial<ICreateReservationDto> {}
