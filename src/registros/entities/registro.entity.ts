import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Habito } from '../../habitos/entities/habito.entity';

@Entity('registros')
export class Registro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  habitoId: string;

  @ManyToOne(() => Habito, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'habitoId' })
  habito: Habito;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'boolean', default: true })
  completado: boolean;

  @Column({ type: 'int' })
  duracionMinutos: number;

  @Column({ type: 'int' })
  rpe: number;

  @Column({ type: 'text', nullable: true })
  notas?: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  creadoEn: Date;
}
