import { Routes } from '@angular/router';
import { Dashboard } from './core/dashboard/dashboard';
import { SteamPredictor } from './cesar/features/steam-predictor/steam-predictor';
import { CharacterManager } from './cesar/features/character-manager/character-manager';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'steam-predictor', component: SteamPredictor },
  { path: 'character-manager', component: CharacterManager },
  { path: '**', redirectTo: '/dashboard' }
];
