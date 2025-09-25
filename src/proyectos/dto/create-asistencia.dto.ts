export class CreateAsistenciaDto {
  beneficiarioId!: number;
  // Acepta 'YYYY-MM-DD' o ISO 'YYYY-MM-DDThh:mm:ss(...)' (se normaliza a 'YYYY-MM-DD')
  fechaRegistro!: string;
  estadoId!: number;
  observaciones?: string | null;
}
