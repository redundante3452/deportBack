import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ type: 'int', default: 0 })
  rachaActual: number;

  @Column({ type: 'int', default: 0 })
  rachaMaxima: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  creadoEn: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  actualizadoEn: Date;
}
