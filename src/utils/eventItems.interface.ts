export interface IEvent {
  id: string;
  name: string;
  totalCapacity: number;
  remainingTickets: number;
  executionDate: Date;
  salesStartTime: Date;
  buyButtonAvailable: boolean;
}
