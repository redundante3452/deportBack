import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeportistasModule } from './deportistas/deportistas.module';
<<<<<<< HEAD
=======
import { HabitosModule } from './habitos/habitos.module';
import { RegistrosModule } from './registros/registros.module';
>>>>>>> feature/hu-02-crud-habito

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const useSsl = configService.get<string>('DB_SSL') === 'true';

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: Number(configService.get<string>('DB_PORT') ?? 5432),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: true,
          ...(useSsl
            ? {
                ssl: {
                  rejectUnauthorized: false,
                },
              }
            : {}),
        };
      },
    }),
    DeportistasModule,
<<<<<<< HEAD
=======
    HabitosModule,
    RegistrosModule,
>>>>>>> feature/hu-02-crud-habito
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
