export class CreateBeneficiarioDto {
  // Persona
  primerNombre: string;
  segundoNombre?: string;
  tercerNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  fechaNacimiento: string; // YYYY-MM-DD
  genero: string; // 1 char
  tipoDocumento: string; // max 15
  numeroDocumento: string; // max 25 (único)
  direccionDetalle?: string;
  municipioId: number;
  locacionId: number;
  telefono?: string;

  // Beneficiario
  estadoId?: number; // tinyint
  fechaInicio: string; // YYYY-MM-DD
  latitud: string; // max 20
  longitud: string; // max 20
}
