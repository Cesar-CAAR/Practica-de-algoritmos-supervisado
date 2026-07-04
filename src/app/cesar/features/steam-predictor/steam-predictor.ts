import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { RegressionService } from './regression';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-steam-predictor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BaseChartDirective],
  templateUrl: './steam-predictor.html',
  styleUrl: './steam-predictor.css',
})

export class SteamPredictor {
  datasetForm: FormGroup;
  
  // Variables para controlar y almacenar la gráfica
  mostrarGrafica = false;
  chartData!: ChartConfiguration<'line'>['data'];
  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Proyección de Ganancias de Steam', font: { size: 18 } }
    }
  };

  constructor(private fb: FormBuilder, private regressionService: RegressionService) {
    this.datasetForm = this.fb.group({
      dataPoints: this.fb.array([])
    });
    this.loadInitialData();
  }

  get dataPoints() {
    return this.datasetForm.get('dataPoints') as FormArray;
  }

  addDataPoint(year: number = 2027, revenue: number = 0) {
    const dataGroup = this.fb.group({
      year: [year, [Validators.required, Validators.min(2000)]],
      revenue: [revenue, [Validators.required, Validators.min(0)]]
    });
    this.dataPoints.push(dataGroup);
  }

  removeDataPoint(index: number) {
    this.dataPoints.removeAt(index);
  }

  loadInitialData() {
    const initialData = [
      { year: 2019, revenue: 6.5 }, { year: 2020, revenue: 9.0 },
      { year: 2021, revenue: 13.0 }, { year: 2022, revenue: 13.0 },
      { year: 2023, revenue: 14.5 }, { year: 2024, revenue: 15.3 },
      { year: 2025, revenue: 16.2 }, { year: 2026, revenue: 17.0 }
    ];
    initialData.forEach(point => this.addDataPoint(point.year, point.revenue));
  }

  onSubmit() {
    if (this.datasetForm.valid) {
      const rawData = this.datasetForm.value.dataPoints;
      const yearsToPredict = [2027, 2028, 2029, 2030];
      const result = this.regressionService.calculateLinearRegression(rawData, yearsToPredict);
      
      // 1. Extraemos todos los años (eje X)
      const allYears = [...rawData.map((d: any) => d.year), ...result.predictions.map((d: any) => d.year)];
      
      // 2. Acomodamos los datos históricos (dejando en null los años futuros para no pintarlos)
      const historicalRevenues = rawData.map((d: any) => d.revenue);
      const historicalDataPadded = [...historicalRevenues, null, null, null, null];
      
      // 3. Generamos la línea de predicción ideal (y = mx + b) para TODOS los años
      const trendLine = allYears.map(year => parseFloat((result.equation.m * year + result.equation.b).toFixed(2)));

      // 4. Construimos el objeto final para la gráfica
      this.chartData = {
        labels: allYears,
        datasets: [
          {
            data: historicalDataPadded,
            label: 'Datos Históricos (Real)',
            borderColor: '#2563eb', // Azul corporativo
            backgroundColor: 'rgba(37, 99, 235, 0.2)',
            pointRadius: 6,
            tension: 0.2
          },
          {
            data: trendLine,
            label: 'Línea de Regresión (Predicción)',
            borderColor: '#16a34a', // Verde
            borderDash: [5, 5], // Línea punteada para diferenciarla
            pointRadius: 4,
            tension: 0
          }
        ]
      };

      // Mostramos la gráfica en el HTML
      this.mostrarGrafica = true;
    }
  }
}