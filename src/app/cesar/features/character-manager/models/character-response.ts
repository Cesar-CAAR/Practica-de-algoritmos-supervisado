export interface CharacterResponse {
  personaje: string;
  saga: string;
  descripcion: string;
  confianza: number;
  coberturaLimitada: boolean;
  tipoPersonaje?: string;
  juegos: GameInfo[];
}

export interface GameInfo {
  nombre: string;
  generos: string[];
  plataformas: string[];
}