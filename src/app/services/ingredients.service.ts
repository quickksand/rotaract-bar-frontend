import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {Ingredient as IngredientDto} from '../api/generated-api/models/ingredient';

@Injectable({
  providedIn: 'root'
})
export class IngredientsService {

  private http = inject(HttpClient);
  private _ingredients$ = new BehaviorSubject<IngredientDto[]>([]);

  constructor() {
    this.loadIngredients();
  }

  get ingredients$(): Observable<IngredientDto[]> {
    return this._ingredients$.asObservable();
  }

  private loadIngredients(): void {
    this.http.get<IngredientDto[]>('/api/ingredients')
      .subscribe(ingredients => {
        console.log('✅ Ingredients loaded:', ingredients);
        this._ingredients$.next(ingredients);
      });
  }

  getIngredientById(id: number): IngredientDto | undefined {
    return this._ingredients$.getValue().find(ingredient => ingredient.id === id);
  }

  getIngredientsByIds(ids: number[]): IngredientDto[] {
    const allIngredients = this._ingredients$.getValue();
    return ids.map(id => allIngredients.find(ingredient => ingredient.id === id))
      .filter(ingredient => ingredient !== undefined) as IngredientDto[];
  }
}
