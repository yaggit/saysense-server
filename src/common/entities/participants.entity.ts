import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SessionP } from './session.entity';

@Entity('participants')
export class Participants {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SessionP, (session) => session.participants, {
    onDelete: 'CASCADE',
  })
  session: SessionP;

  @Column()
  name: string;

  @Column()
  role: string;

  @CreateDateColumn()
  createdAt: Date;
}
