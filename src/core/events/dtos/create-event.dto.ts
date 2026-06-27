export interface ICreateEventDto {
  title: string;
  price: number;
  location: string;
  capacity: number;
  executionDate: Date;
  salesStartTime: Date;
  salesEndTime: Date;
}
