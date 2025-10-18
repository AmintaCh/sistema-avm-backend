export class CreateActividadDto {
  nombreActividad!: string;
  tipoActividad!: string;
  descripcion?: string | null;
  fechaActividad!: string; // YYYY-MM-DD
  lugar?: string | null;
}
