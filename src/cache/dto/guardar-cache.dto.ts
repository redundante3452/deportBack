import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GuardarCacheDto {
  @ApiProperty({
    description:
      'Clave con la que se guarda el valor (la elige quien consume la caché)',
    example: 'articulos:api-fastify',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  key: string;

  @ApiProperty({
    description:
      'Valor a guardar. Puede ser cualquier JSON: objeto, arreglo, string, número.',
    example: { articulos: [] },
  })
  @IsDefined()
  value: unknown;

  @ApiPropertyOptional({
    description:
      'Segundos que dura la entrada antes de expirar (por defecto 60, máximo 3600)',
    example: 60,
    minimum: 1,
    maximum: 3600,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3600)
  ttl?: number;
}
