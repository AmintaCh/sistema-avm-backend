export class CreateUserDto {
  // Persona
  primerNombre: string;
  segundoNombre?: string;
  tercerNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  fechaNacimiento: string; // ISO date (YYYY-MM-DD)
  genero: string; // 1 char
  tipoDocumento: string; // max 15
  numeroDocumento: string; // max 25
  direccionDetalle?: string;
  municipioId: number;
  locacionId: number;
  telefono?: string;

  // Usuario
  nombreUsuario?: string; // si no se envía, se genera
  correoElectronico: string;
  contrasena: string;
  rolId: number;
  estadoId?: number; // default 1
}
