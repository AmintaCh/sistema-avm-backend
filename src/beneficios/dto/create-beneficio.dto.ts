export class CreateBeneficioDto {
  nombreBeneficio!: string; // requerido, max 100
  descripcion?: string | null; // opcional
  unidadMedida!: string; // requerido, max 50
}

