export interface DetalleErrorCampo {
  campo: string;
  mensaje: string;
}

export class ErrorApi extends Error {
  readonly status: number;
  readonly detalles?: DetalleErrorCampo[];

  constructor(status: number, message: string, detalles?: DetalleErrorCampo[]) {
    super(message);
    this.name = "ErrorApi";
    this.status = status;
    this.detalles = detalles;
  }
}
