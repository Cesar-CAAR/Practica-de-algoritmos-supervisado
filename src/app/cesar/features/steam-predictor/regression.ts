import { Injectable } from '@angular/core';

export interface DataPoint {
  year: number;
  revenue: number;
}

@Injectable({
  providedIn: 'root'
})
export class RegressionService {

  constructor() { }

  /**
   * Calcula la regresión lineal utilizando el método de mínimos cuadrados
   * @param data Dataset histórico capturado por el usuario
   * @param targetYears Años futuros a predecir (ej. [2027, 2028, 2029, 2030])
   */
  calculateLinearRegression(data: DataPoint[], targetYears: number[]) {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    // Calculamos las sumatorias necesarias para las fórmulas
    data.forEach(point => {
      sumX += point.year;
      sumY += point.revenue;
      sumXY += (point.year * point.revenue);
      sumX2 += (point.year * point.year);
    });

    // Calculamos la pendiente (m) y la intersección (b)
    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / n;

    // Generamos las predicciones para los años objetivo
    const predictions: DataPoint[] = targetYears.map(year => ({
      year: year,
      // Redondeamos el resultado a 2 decimales para que parezca moneda
      revenue: parseFloat((m * year + b).toFixed(2)) 
    }));

    // Retornamos el modelo y los resultados
    return { 
      equation: { m, b }, 
      predictions 
    };
  }
}