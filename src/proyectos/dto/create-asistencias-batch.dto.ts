export class CreateAsistenciasBatchDto {
  // Lista de asistencias a registrar
  items!: Array<{
    beneficiarioId: number;
    // Acepta 'YYYY-MM-DD' o ISO 'YYYY-MM-DDThh:mm:ss(...)' (se normaliza a 'YYYY-MM-DD')
    fechaRegistro: string;
    estadoId: number;
    observaciones?: string | null;
  }>;

  // Si true, omite registros existentes (actividad+beneficiario)
  // Si false, lanza error ante duplicados
  // Nota: cuando upsert está activo por defecto, este valor se ignora.
  skipExistentes?: boolean;

  // Upsert: por regla general está ACTIVO por defecto.
  // Actualiza existentes (fechaRegistro, estadoId, observaciones) y crea los nuevos.
  // En caso de querer desactivarlo en el futuro, este flag permitiría controlarlo.
  upsert?: boolean;
}
