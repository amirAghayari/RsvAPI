import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("logs")
export class Log {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userEmail: string;

  @Column()
  action: string; // 'reserve', 'cancel', 'pay'

  @Column("uuid", { nullable: true })
  eventId: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  timestamp: Date;

  @Column()
  status: string; //  'pending', 'paid', etc.

  @Column({ type: "jsonb", nullable: true })
  details: any; // JSONB for extra info
}
