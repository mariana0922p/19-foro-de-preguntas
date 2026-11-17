import { z } from "zod";

export const crearPreguntaSchema = z
  .object({
    titulo: z
      .string()
      .trim()
      .min(10, "El título debe tener al menos 10 caracteres")
      .max(150, "El título no puede superar los 150 caracteres"),
    cuerpo: z
      .string()
      .trim()
      .min(20, "El cuerpo debe tener al menos 20 caracteres")
      .max(5000, "El cuerpo no puede superar los 5000 caracteres"),
    etiquetas: z
      .array(z.string().trim().min(1, "La etiqueta no puede estar vacía").max(30))
      .min(1, "Agrega al menos una etiqueta")
      .max(5, "Máximo 5 etiquetas por pregunta"),
  })
  .strict();

export const crearRespuestaSchema = z
  .object({
    cuerpo: z
      .string()
      .trim()
      .min(20, "La respuesta debe tener al menos 20 caracteres")
      .max(5000, "La respuesta no puede superar los 5000 caracteres"),
  })
  .strict();

export const crearComentarioSchema = z
  .object({
    cuerpo: z
      .string()
      .trim()
      .min(2, "El comentario debe tener al menos 2 caracteres")
      .max(500, "El comentario no puede superar los 500 caracteres"),
  })
  .strict();

export const votarSchema = z
  .object({
    valor: z.union([z.literal(1), z.literal(-1)]),
  })
  .strict();

export const aceptarRespuestaSchema = z
  .object({
    respuestaId: z.string().trim().min(1, "Debes indicar el ID de la respuesta"),
  })
  .strict();

export const moderarPreguntaSchema = z
  .object({
    oculta: z.boolean(),
  })
  .strict();

export const filtroPreguntasSchema = z.object({
  q: z.string().trim().max(100).optional(),
  etiqueta: z.string().trim().max(30).optional(),
  orden: z.enum(["recientes", "populares"]).default("recientes"),
  limite: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().trim().max(200).optional(),
});

export type CrearPreguntaInput = z.infer<typeof crearPreguntaSchema>;
export type CrearRespuestaInput = z.infer<typeof crearRespuestaSchema>;
export type CrearComentarioInput = z.infer<typeof crearComentarioSchema>;
export type VotarInput = z.infer<typeof votarSchema>;
export type AceptarRespuestaInput = z.infer<typeof aceptarRespuestaSchema>;
export type ModerarPreguntaInput = z.infer<typeof moderarPreguntaSchema>;
export type FiltroPreguntasInput = z.infer<typeof filtroPreguntasSchema>;
