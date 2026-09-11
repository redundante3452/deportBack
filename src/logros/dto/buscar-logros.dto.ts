import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class BuscarLogrosDto {
  @ApiPropertyOptional({
    description: 'UUID del hábito para filtrar logros asociados',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  habitoId?: string;

  @ApiPropertyOptional({
    description: 'UUID del deportista para filtrar sus logros',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  deportistaId?: string;
}
