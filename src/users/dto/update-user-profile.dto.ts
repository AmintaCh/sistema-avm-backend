export class UpdateUserProfileDto {
  // Persona (opcionales)
  primerNombre?: string;
  segundoNombre?: string | null;
  tercerNombre?: string | null;
  primerApellido?: string;
  segundoApellido?: string | null;
  fechaNacimiento?: string | null; // ISO (YYYY-MM-DD)
  genero?: string | null;
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
  direccionDetalle?: string | null;
  municipioId?: number | null;
  locacionId?: number | null;
  telefono?: string | null;

  // Usuario (opcionales)
  nombreUsuario?: string;
  contrasena?: string; // plain, si se envía se re-hashea
}
