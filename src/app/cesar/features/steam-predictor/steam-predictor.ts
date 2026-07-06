import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- NUEVO: Necesario para los menús desplegables
import { RegressionService } from './regression';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import * as Papa from 'papaparse';

@Component({
  selector: 'app-steam-predictor',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective], // <-- Agregamos FormsModule aquí
  templateUrl: './steam-predictor.html',
  styleUrl: './steam-predictor.css',
})
export class SteamPredictor {
  currentStep: 'upload' | 'config' | 'results' = 'upload';
  uploadedFiles: File[] = [];
  
  // VARIABLES DE MACHINE LEARNING (NUEVAS)
  rawCsvData: any[] = [];
  availableColumns: string[] = [];
  selectedX: string = '';
  selectedY: string = '';
  aggregationMethod: 'sum' | 'avg' = 'sum';

  chartData!: ChartConfiguration<'line'>['data'];
  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { title: { display: true, text: 'Proyección del Modelo', font: { size: 16 } } }
  };

  constructor(private regressionService: RegressionService) {}

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        if (this.uploadedFiles.length < 5) this.uploadedFiles.push(files[i]);
      }
    }
  }

  removeFile(index: number) {
    this.uploadedFiles.splice(index, 1);
  }

  // AHORA LEEMOS EL ARCHIVO AL CAMBIAR DE PANTALLA PARA LLENAR LOS MENÚS
  goToConfig() {
    if (this.uploadedFiles.length === 0) return;

    const fileToParse = this.uploadedFiles[0];
    Papa.parse(fileToParse, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        this.rawCsvData = results.data as any[];
        this.availableColumns = results.meta.fields || Object.keys(this.rawCsvData[0] || {});
        
        // El algoritmo hace una "sugerencia" inicial, pero el usuario puede cambiarla
        this.selectedX = this.availableColumns.find(h => /year|año|anio|date|fecha|period/i.test(h)) || this.availableColumns[0];
        this.selectedY = this.availableColumns.find(h => /revenue|sales|ganancia|price|usd|value|total|players|presupuesto|puntaje/i.test(h) && h !== this.selectedX) || this.availableColumns[1];
        
        this.currentStep = 'config';
      }
    });
  }

  goToUpload() {
    this.currentStep = 'upload';
  }

  // ENTRENAMIENTO BASADO EN LO QUE EL USUARIO ELIGIÓ EN LA INTERFAZ
  startTrainingJob() {
    const aggregation: { [key: number]: { sum: number, count: number } } = {};

    this.rawCsvData.forEach(row => {
      const rawX = String(row[this.selectedX]).substring(0, 4);
      const xValue = Number(rawX);
      const yValue = Number(row[this.selectedY]);

      if (!isNaN(xValue) && !isNaN(yValue)) {
        if (!aggregation[xValue]) aggregation[xValue] = { sum: 0, count: 0 };
        aggregation[xValue].sum += yValue;
        aggregation[xValue].count += 1;
      }
    });

    // Aplicamos Matemáticas: Suma o Promedio según lo elegido por el usuario
    let cleanedData = Object.keys(aggregation).map(xStr => {
      const xNum = Number(xStr);
      const agg = aggregation[xNum];
      const finalValue = this.aggregationMethod === 'sum' ? agg.sum : (agg.sum / agg.count);
      
      return { year: xNum, revenue: parseFloat(finalValue.toFixed(2)) };
    }).sort((a, b) => a.year - b.year);

    const currentYear = new Date().getFullYear(); 
    cleanedData = cleanedData.filter(d => d.year !== currentYear);

    if (cleanedData.length < 2) {
      alert('Error: Datos insuficientes para entrenar el modelo con las columnas seleccionadas.');
      return;
    }

    const lastHistoricalPoint = cleanedData[cleanedData.length - 1];
    const yearsToPredict = [lastHistoricalPoint.year + 1, lastHistoricalPoint.year + 2, lastHistoricalPoint.year + 3, lastHistoricalPoint.year + 4];

    const result = this.regressionService.calculateLinearRegression(cleanedData, yearsToPredict);
    const allYears = [...cleanedData.map(d => d.year), ...yearsToPredict];
    
    const historicalDataPadded = [...cleanedData.map(d => d.revenue), ...yearsToPredict.map(() => null)];
    const nullsForPast = cleanedData.map((d, index) => index === cleanedData.length - 1 ? d.revenue : null);
    const projectionDataPadded = [...nullsForPast, ...yearsToPredict.map(year => parseFloat((result.equation.m * year + result.equation.b).toFixed(2)))];

    this.chartOptions!.plugins!.title!.text = `Análisis de ${this.selectedY} (${this.aggregationMethod === 'sum' ? 'Suma Total' : 'Promedio'})`;

    this.chartData = {
      labels: allYears,
      datasets: [
        { data: historicalDataPadded, label: `Histórico: ${this.selectedY}`, borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.2)', pointRadius: 6, tension: 0.2 },
        { data: projectionDataPadded, label: 'Regresión Lineal', borderColor: '#2563eb', borderDash: [5, 5], pointRadius: 6, pointBackgroundColor: '#ffffff', tension: 0 }
      ]
    };

    this.currentStep = 'results';
  }
}