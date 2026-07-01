export interface ICreateEventDto {
  title: string;
  description?: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  userId: string;
}
