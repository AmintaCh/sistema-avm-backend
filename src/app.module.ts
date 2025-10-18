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
import { ProyectosUsuariosController } from './proyectos/usuarios-proyecto/usuarios-proyecto.controller';
import { ProyectosUsuariosService } from './proyectos/usuarios-proyecto/usuarios-proyecto.service';
import { ProyectosBeneficiariosController } from './proyectos/beneficiarios-proyecto/beneficiarios-proyecto.controller';
import { ProyectosBeneficiariosService } from './proyectos/beneficiarios-proyecto/beneficiarios-proyecto.service';
import { ProyectosActividadesController } from './proyectos/actividades/actividades.controller';
import { ProyectosActividadesService } from './proyectos/actividades/actividades.service';
import { ProyectosAsistenciasController } from './proyectos/asistencias/asistencias.controller';
import { ProyectosAsistenciasService } from './proyectos/asistencias/asistencias.service';
import { Estado } from './entities/estado.entity';
import { UsuarioProyecto } from './entities/usuario-proyecto.entity';
import { BeneficiarioProyecto } from './entities/beneficiario-proyecto.entity';
import { Actividad } from './entities/actividad.entity';
import { Asistencia } from './entities/asistencia.entity';
import { UsuarioSettings } from './entities/usuario-settings.entity';
import { Beneficio } from './entities/beneficio.entity';
import { EntregaBeneficio } from './entities/entrega-beneficio.entity';
import { EventoEntrega } from './entities/evento-entrega.entity';
import { BeneficiosController } from './beneficios/beneficios.controller';
import { BeneficiosService } from './beneficios/beneficios.service';
import { BeneficioProyecto } from './entities/beneficio-proyecto.entity';
import { ProyectosBeneficiosController } from './proyectos/beneficios-proyecto/beneficios-proyecto.controller';
import { ProyectosBeneficiosService } from './proyectos/beneficios-proyecto/beneficios-proyecto.service';
import { ProyectosEntregasBeneficiosController } from './proyectos/entregas-beneficios/entregas-beneficios.controller';
import { ProyectosEntregasPorEventoController } from './proyectos/entregas-beneficios/entregas-por-evento.controller';
import { ProyectosEntregasBeneficiosService } from './proyectos/entregas-beneficios/entregas-beneficios.service';
import { ProyectosEventosEntregaController } from './proyectos/eventos-entrega/eventos-entrega.controller';
import { ProyectosEventosEntregaService } from './proyectos/eventos-entrega/eventos-entrega.service';
import { BeneficiariosDetalleController } from './beneficiarios-detalle/beneficiarios-detalle.controller';
import { BeneficiariosDetalleService } from './beneficiarios-detalle/beneficiarios-detalle.service';
import { BeneficiarioDetalleView } from './reporting/entities/vw-beneficiarios-detalle.view';
import { BeneficiarioDetalleProyectoView } from './reporting/entities/vw-beneficiarios-detalle-proyecto.view';
import { BeneficiariosDetalleProyectoController } from './beneficiarios-detalle-proyecto/beneficiarios-detalle-proyecto.controller';
import { BeneficiariosDetalleProyectoService } from './beneficiarios-detalle-proyecto/beneficiarios-detalle-proyecto.service';
import { BeneficiarioDetalleAggView } from './reporting/entities/vw-beneficiarios-detalle-agg.view';
import { BeneficiariosDetalleAggController } from './beneficiarios-detalle-agg/beneficiarios-detalle-agg.controller';
import { BeneficiariosDetalleAggService } from './beneficiarios-detalle-agg/beneficiarios-detalle-agg.service';
import { BeneficiariosActivosPorProyectoView } from './reporting/entities/vw-beneficiarios-activos-por-proyecto.view';
import { BeneficiariosActivosPorProyectoController } from './beneficiarios-activos-por-proyecto/beneficiarios-activos-por-proyecto.controller';
import { BeneficiariosActivosPorProyectoService } from './beneficiarios-activos-por-proyecto/beneficiarios-activos-por-proyecto.service';
import { DistribucionBeneficiariosGeneroView } from './reporting/entities/vw-distribucion-beneficiarios-genero.view';
import { BeneficiariosDistribucionGeneroController } from './beneficiarios-distribucion-genero/beneficiarios-distribucion-genero.controller';
import { BeneficiariosDistribucionGeneroService } from './beneficiarios-distribucion-genero/beneficiarios-distribucion-genero.service';

@Module({
  imports: [
    // Carga variables de entorno desde .env y las expone globalmente via ConfigService
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      //isGlobal: true,
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '3306', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [
        Persona,
        Usuario,
        Rol,
        Beneficiario,
        Municipio,
        Departamento,
        Locacion,
        Proyecto,
        Estado,
        UsuarioProyecto,
        BeneficiarioProyecto,
        BeneficioProyecto,
        Actividad,
        Asistencia,
        Beneficio,
        EntregaBeneficio,
        EventoEntrega,
        UsuarioSettings,
        BeneficiarioDetalleView,
        BeneficiarioDetalleProyectoView,
        BeneficiarioDetalleAggView,
        DistribucionBeneficiariosGeneroView,
        BeneficiariosActivosPorProyectoView,
      ],
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
      UsuarioProyecto,
      BeneficiarioProyecto,
      BeneficioProyecto,
      Actividad,
      Asistencia,
      Beneficio,
      EntregaBeneficio,
      EventoEntrega,
      UsuarioSettings,
      BeneficiarioDetalleView,
      BeneficiarioDetalleProyectoView,
      BeneficiarioDetalleAggView,
      DistribucionBeneficiariosGeneroView,
      BeneficiariosActivosPorProyectoView,
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
    ProyectosUsuariosController,
    ProyectosBeneficiariosController,
    ProyectosActividadesController,
    ProyectosAsistenciasController,
    BeneficiosController,
    ProyectosBeneficiosController,
    ProyectosEntregasBeneficiosController,
    ProyectosEntregasPorEventoController,
    ProyectosEventosEntregaController,
    BeneficiariosDetalleController,
    BeneficiariosDetalleProyectoController,
    BeneficiariosDetalleAggController,
    BeneficiariosDistribucionGeneroController,
    BeneficiariosActivosPorProyectoController,
  ],
  providers: [
    AppService,
    UsersService,
    BeneficiariosService,
    CatalogosService,
    LocacionesService,
    ProyectosService,
    ProyectosUsuariosService,
    ProyectosBeneficiariosService,
    ProyectosActividadesService,
    ProyectosAsistenciasService,
    BeneficiosService,
    ProyectosBeneficiosService,
    ProyectosEntregasBeneficiosService,
    ProyectosEventosEntregaService,
    BeneficiariosDetalleService,
    BeneficiariosDetalleProyectoService,
    BeneficiariosDetalleAggService,
    BeneficiariosDistribucionGeneroService,
    BeneficiariosActivosPorProyectoService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
