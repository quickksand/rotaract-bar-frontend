import {inject, Injectable} from '@angular/core';
import {BehaviorSubject, catchError, EMPTY, of, tap} from 'rxjs';
import {ProductDto} from '../../api/generated-api/models';
import {HttpClient} from '@angular/common/http';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

export const PRODUCTS_CACHE_KEY = 'products_cache';

@Injectable({
  providedIn: "root"
})
export class ProductsService {

  private http = inject(HttpClient);
  private _products$ = new BehaviorSubject<ProductDto[] | undefined>(undefined);
  private _loadFailed$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.http.get<ProductDto[]>('/api/products')
      .pipe(
        tap(products => localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products))),
        catchError(() => {
          const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
          if (cached) return of(JSON.parse(cached) as ProductDto[]);
          this._loadFailed$.next(true);
          return EMPTY;
        }),
        takeUntilDestroyed()
      )
      .subscribe(products => this._products$.next(products));
  }

  get products$() {
    return this._products$.asObservable();
  }

  get loadFailed$() {
    return this._loadFailed$.asObservable();
  }

  public getProductById(productId: number){
    return this._products$.getValue()!.find(product => product.id === productId)
  }

  public getProductsByCategory(category: string): ProductDto[] {
    return this._products$.getValue()!.filter(p => p.category === category);

  }
}
