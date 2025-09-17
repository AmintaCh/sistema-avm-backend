import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Persona } from './entities/persona.entity';
import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Beneficiario } from './entities/beneficiario.entity';
import { BeneficiariosController } from './beneficiarios/beneficiarios.controller';
import { BeneficiariosService } from './beneficiarios/beneficiarios.service';
import { Municipio } from './entities/municipio.entity';
import { Departamento } from './entities/departamento.entity';
import { CatalogosController } from './catalogos/catalogos.controller';
import { CatalogosService } from './catalogos/catalogos.service';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Locacion } from './entities/locacion.entity';
import { LocacionesController } from './locaciones/locaciones.controller';
import { LocacionesService } from './locaciones/locaciones.service';
import { Proyecto } from './entities/proyecto.entity';
import { ProyectosController } from './proyectos/proyectos.controller';
import { ProyectosService } from './proyectos/proyectos.service';
import { Estado } from './entities/estado.entity';

@Module({
  imports: [
    // Carga variables de entorno desde .env y las expone globalmente via ConfigService
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      //isGlobal: true,
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '3306', 10),
      username: process.env.DB_USER || 'app_user',
      password: process.env.DB_PASSWORD || 'TuPasswordFuerte!',
      database: process.env.DB_DATABASE || 'BD_VIVAMOS',
      entities: [Persona, Usuario, Rol, Beneficiario, Municipio, Departamento, Locacion, Proyecto, Estado],
      synchronize: false,
      // logging: true,
    }),
    TypeOrmModule.forFeature([
      Persona,
      Usuario,
      Rol,
      Beneficiario,
      Municipio,
      Departamento,
      Locacion,
      Proyecto,
      Estado,
    ]),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'change-me-in-.env'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [
    AppController,
    UsersController,
    BeneficiariosController,
    CatalogosController,
    LocacionesController,
    ProyectosController,
  ],
  providers: [
    AppService,
    UsersService,
    BeneficiariosService,
    CatalogosService,
    LocacionesService,
    ProyectosService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
