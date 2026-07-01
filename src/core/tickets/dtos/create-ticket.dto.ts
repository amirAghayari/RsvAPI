export interface ICreateTicketDto {
  eventId: string;

  title: string;
  description?: string;

  price: number;

  capacity: number;

  maxPerUser?: number;

  saleStartsAt: Date;

  saleEndsAt: Date;
}
