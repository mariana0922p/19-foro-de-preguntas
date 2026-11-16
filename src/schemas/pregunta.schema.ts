import { z } from "zod";

export const crearPreguntaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(10, "El titulo debe tener al menos 10 caracteres")
    .max(150, "El titulo no puede superar los 150 caracteres"),
  cuerpo: z
    .string()
    .trim()
    .min(20, "El cuerpo debe tener al menos 20 caracteres")
    .max(5000, "El cuerpo no puede superar los 5000 caracteres"),
  etiquetas: z
    .array(z.string().trim().min(1).max(30))
    .min(1, "Agrega al menos una etiqueta")
    .max(5, "Maximo 5 etiquetas por pregunta"),
}).strict();

export const filtroPreguntasSchema = z.object({
  q: z.string().trim().max(100).optional(),
  etiqueta: z.string().trim().max(30).optional(),
  orden: z.enum(["recientes", "populares"]).default("recientes"),
});

export type CrearPreguntaInput = z.infer<typeof crearPreguntaSchema>;
export type FiltroPreguntasInput = z.infer<typeof filtroPreguntasSchema>;
