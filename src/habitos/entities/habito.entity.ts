import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Deportista } from '../../deportistas/entities/deportista.entity';

@Entity('habitos')
export class Habito {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 255 })
  descripcion: string;

  @Column({ length: 50 })
  frecuencia: string;

  @Column({ type: 'uuid' })
  deportistaId: string;

  @ManyToOne(() => Deportista, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'deportistaId' })
  deportista: Deportista;

  @Column({ type: 'int', default: 0 })
  rachaActual: number;

  @Column({ type: 'int', default: 0 })
  rachaMaxima: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  creadoEn: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  actualizadoEn: Date;
}
