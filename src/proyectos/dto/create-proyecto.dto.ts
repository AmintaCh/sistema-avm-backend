export class CreateProyectoDto {
  nombreProyecto!: string; // max 100
  descripcion?: string; // text
  fechaInicio!: string; // YYYY-MM-DD
  fechaFin?: string; // YYYY-MM-DD
  estadoId!: number; // tinyint (requerido por BD)
}
