import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CharacterResponse } from '../models/character-response';

@Injectable({
  providedIn: 'root'
})
export class CharacterRecognitionService {
  private readonly apiUrl = 'http://localhost:5000/api/personajes/reconocer';

  constructor(private http: HttpClient) {}

  recognizeCharacter(image: File): Observable<CharacterResponse> {
    const formData = new FormData();
    formData.append('image', image);

    return this.http.post<CharacterResponse>(this.apiUrl, formData);
  }
}