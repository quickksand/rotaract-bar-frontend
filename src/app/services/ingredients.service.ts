import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, catchError, EMPTY, of, tap} from 'rxjs';
import {Ingredient as IngredientDto} from '../api/generated-api/models/ingredient';

export const INGREDIENTS_CACHE_KEY = 'ingredients_cache';

@Injectable({
  providedIn: 'root'
})
export class IngredientsService {

  private http = inject(HttpClient);
  private _ingredients$ = new BehaviorSubject<IngredientDto[]>([]);

  constructor() {
    this.loadIngredients();
  }

  private loadIngredients(): void {
    this.http.get<IngredientDto[]>('/api/ingredients')
      .pipe(
        tap(ingredients => localStorage.setItem(INGREDIENTS_CACHE_KEY, JSON.stringify(ingredients))),
        catchError(() => {
          const cached = localStorage.getItem(INGREDIENTS_CACHE_KEY);
          return cached ? of(JSON.parse(cached) as IngredientDto[]) : EMPTY;
        })
      )
      .subscribe(ingredients => this._ingredients$.next(ingredients));
  }

  getIngredientsByIds(ids: number[]): IngredientDto[] {
    const allIngredients = this._ingredients$.getValue();
    return ids.map(id => allIngredients.find(ingredient => ingredient.id === id))
      .filter(ingredient => ingredient !== undefined) as IngredientDto[];
  }
}
