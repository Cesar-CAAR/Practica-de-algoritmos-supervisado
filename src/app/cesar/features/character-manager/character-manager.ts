import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CharacterResponse } from './models/character-response';
import { CharacterRecognitionService } from './services/character-recognition.service';

@Component({
  selector: 'app-character-manager',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './character-manager.html',
  styleUrl: './character-manager.css',
})
export class CharacterManager {
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  result: CharacterResponse | null = null;
  isLoading = false;
  errorMessage = '';
  isDragging = false;

  constructor(private characterService: CharacterRecognitionService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.setSelectedFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;

    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    this.setSelectedFile(file);
  }

  recognizeCharacter(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Primero selecciona una imagen del personaje.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.result = null;

    this.characterService.recognizeCharacter(this.selectedFile).subscribe({
      next: (response) => {
        this.result = {
          ...response,
          juegos: response.juegos ?? [],
          confianza: response.confianza ?? 0,
          coberturaLimitada: response.coberturaLimitada ?? false
        };

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al reconocer personaje:', error);

        this.errorMessage =
          'No se pudo reconocer el personaje. Verifica que el backend .NET y el servicio de IA estén ejecutándose.';

        this.isLoading = false;
      }
    });
  }

  clearSelection(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.result = null;
    this.errorMessage = '';
    this.isLoading = false;
  }

  private setSelectedFile(file: File): void {
    this.errorMessage = '';
    this.result = null;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'El archivo seleccionado debe ser una imagen.';
      return;
    }

    const maxSizeMb = 5;
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      this.errorMessage = `La imagen no debe superar los ${maxSizeMb} MB.`;
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();

    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };

    reader.readAsDataURL(file);
  }
}