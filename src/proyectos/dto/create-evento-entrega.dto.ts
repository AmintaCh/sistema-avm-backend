export class CreateEventoEntregaDto {
  nombre!: string;
  // Acepta 'YYYY-MM-DD' o ISO 'YYYY-MM-DDThh:mm:ss(...)' (se normaliza a 'YYYY-MM-DD')
  fechaEvento!: string;
  lugar?: string | null;
  observaciones?: string | null;
  createdBy!: number;
}

