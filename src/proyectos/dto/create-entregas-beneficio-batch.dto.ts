export class CreateEntregasBeneficioBatchDto {
  // Lista de entregas a registrar
  items!: Array<{
    beneficiarioId: number;
    // Acepta 'YYYY-MM-DD' o ISO 'YYYY-MM-DDThh:mm:ss(...)' (se normaliza a 'YYYY-MM-DD')
    fechaEntrega: string;
    cantidad: number;
    estadoId: number;
    observaciones?: string | null;
  }>;

  // Opcional: asociar todas las entregas a un evento existente del proyecto
  eventoId?: number;

  // Opcional: usuario (id) que ejecutó la entrega
  entregadoPor?: number;

  // Si true, omite registros existentes (beneficio+beneficiario+fecha)
  // Si false, lanza error ante duplicados
  // Nota: cuando upsert está activo por defecto, este valor se ignora.
  skipExistentes?: boolean;

  // Upsert activo por defecto: actualiza cantidades/estado/observaciones
  // en registros existentes y crea los nuevos.
  upsert?: boolean;
}
