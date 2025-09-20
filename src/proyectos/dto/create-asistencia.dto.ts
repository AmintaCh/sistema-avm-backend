export class CreateAsistenciaDto {
  beneficiarioId!: number;
  fechaRegistro!: string; // YYYY-MM-DD
  estadoId!: number;
  observaciones?: string | null;
}

