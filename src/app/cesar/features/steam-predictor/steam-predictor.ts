import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegressionService } from './regression';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
// 1. Importamos PapaParse para el parseo de archivos CSV
import * as Papa from 'papaparse';

@Component({
  selector: 'app-steam-predictor',
  standalone: true,
  imports: [CommonModule, BaseChartDirective], 
  templateUrl: './steam-predictor.html',
  styleUrl: './steam-predictor.css',
})
export class SteamPredictor {
  currentStep: 'upload' | 'config' | 'results' = 'upload';
  uploadedFiles: File[] = [];
  
  chartData!: ChartConfiguration<'line'>['data'];
  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: 'Proyección del Mercado de Skins (CS:GO / CS2)', font: { size: 16 } }
    }
  };

  constructor(private regressionService: RegressionService) {}

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        if (this.uploadedFiles.length < 5) {
          this.uploadedFiles.push(files[i]);
        } else {
          alert('Límite alcanzado: Solo puedes subir un máximo de 5 datasets.');
          break;
        }
      }
    }
  }

  removeFile(index: number) {
    this.uploadedFiles.splice(index, 1);
  }

  goToConfig() {
    if (this.uploadedFiles.length > 0) this.currentStep = 'config';
  }

  goToUpload() {
    this.currentStep = 'upload';
  }

  // 2. Procesamos el archivo real cargado por el usuario
  startTrainingJob() {
    if (this.uploadedFiles.length === 0) return;

    const fileToParse = this.uploadedFiles[0];

    Papa.parse(fileToParse, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawRows = results.data as any[];
        const yearlyAggregation: { [key: number]: number } = {};

        rawRows.forEach(row => {
          const year = Number(row.year);
          const revenue = Number(row.estimated_skins_market_usd_m);
          if (!isNaN(year) && !isNaN(revenue)) {
            if (!yearlyAggregation[year]) yearlyAggregation[year] = 0;
            yearlyAggregation[year] += revenue;
          }
        });

        // 1. Limpiamos y ordenamos los datos
        let cleanedData = Object.keys(yearlyAggregation).map(yearStr => ({
          year: Number(yearStr),
          revenue: parseFloat(yearlyAggregation[Number(yearStr)].toFixed(2))
        })).sort((a, b) => a.year - b.year);

        // 2. CORRECCIÓN MATEMÁTICA: Excluimos el año actual si está incompleto
        const currentYear = new Date().getFullYear(); 
        cleanedData = cleanedData.filter(d => d.year !== currentYear);

        if (cleanedData.length === 0) {
          alert('Error: No hay datos suficientes para entrenar el modelo.');
          return;
        }

        // 3. Obtenemos el último punto válido (Ej. 2025) para conectar las gráficas
        const lastHistoricalPoint = cleanedData[cleanedData.length - 1];

        // 4. Proyectamos los siguientes 4 años a partir del último punto
        const yearsToPredict = [
          lastHistoricalPoint.year + 1, 
          lastHistoricalPoint.year + 2, 
          lastHistoricalPoint.year + 3, 
          lastHistoricalPoint.year + 4
        ];

        const result = this.regressionService.calculateLinearRegression(cleanedData, yearsToPredict);
        
        const allYears = [...cleanedData.map(d => d.year), ...yearsToPredict];
        
        // DATASET 1: Línea Histórica (Azul Sólida)
        const historicalRevenues = cleanedData.map(d => d.revenue);
        // Llenamos el futuro con nulls para que la línea sólida se detenga
        const historicalDataPadded = [...historicalRevenues, ...yearsToPredict.map(() => null)];

        // DATASET 2: Línea de Proyección (Azul Punteada)
        // Llenamos el pasado con nulls, EXCEPTO el último punto histórico para que las líneas se enganchen
        const nullsForPast = cleanedData.map((d, index) => 
          index === cleanedData.length - 1 ? d.revenue : null
        );
        const predictedFutureRevenues = yearsToPredict.map(year => 
          parseFloat((result.equation.m * year + result.equation.b).toFixed(2))
        );
        const projectionDataPadded = [...nullsForPast, ...predictedFutureRevenues];

        // 5. Renderizamos la gráfica unificada
        this.chartData = {
          labels: allYears,
          datasets: [
            {
              data: historicalDataPadded,
              label: 'Histórico de Mercado (USD Millones)',
              borderColor: '#2563eb', // Azul original
              backgroundColor: 'rgba(37, 99, 235, 0.2)',
              pointRadius: 6,
              tension: 0.2
            },
            {
              data: projectionDataPadded,
              label: 'Proyección Algorítmica',
              borderColor: '#2563eb', // Mismo azul
              borderDash: [5, 5], // Estilo punteado indicando predicción
              pointRadius: 6,
              pointBackgroundColor: '#ffffff', // Fondo blanco en los puntos para diferenciarlos
              tension: 0
            }
          ]
        };

        this.currentStep = 'results';
      },
      error: (error) => {
        console.error('Error al procesar el archivo CSV:', error);
        alert('Hubo un error al procesar el archivo de datos.');
      }
    });
  }
}