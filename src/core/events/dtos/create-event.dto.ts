export interface ICreateEventDto {
  title: string;
  userId: string;
  price: number;
  location: string;
  capacity: number;
  remainingCapacity?: number;
  executionDate: Date;
  salesStartTime: Date;
  salesEndTime: Date;
}
