import {inject, Injectable} from '@angular/core';
import {BehaviorSubject, catchError, distinctUntilChanged, EMPTY, map, of, switchMap, tap, timer} from 'rxjs';
import {ProductDto} from '../../api/generated-api/models';
import {HttpClient} from '@angular/common/http';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ProductControllerService} from '../../api/generated-api/services';

export const PRODUCTS_CACHE_KEY = 'products_cache';

const PRODUCTS_POLL_INTERVAL_MS = 30_000;

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  private http = inject(HttpClient);
  private productApi = inject(ProductControllerService);

  private _products$ = new BehaviorSubject<ProductDto[] | undefined>(undefined);
  private _loadFailed$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.loadProducts();
    this.startPricesMetaPolling();
  }

  get products$() {
    return this._products$.asObservable();
  }

  get loadFailed$() {
    return this._loadFailed$.asObservable();
  }

  public getProductById(productId: number): ProductDto | undefined {
    return this._products$.getValue()?.find(product => product.id === productId);
  }

  public getProductsByCategory(category: string): ProductDto[] {
    return this._products$.getValue()
      ?.filter(p => p.category === category && !p.outOfStock) ?? [];
  }

  loadProducts(): void {
    this.http.get<ProductDto[]>('/api/products')
      .pipe(
        tap(products => localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products))),
        catchError(() => {
          const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
          if (cached) return of(JSON.parse(cached) as ProductDto[]);
          this._loadFailed$.next(true);
          return EMPTY;
        }),
      )
      .subscribe(products => this._products$.next(products));
  }

  private startPricesMetaPolling(): void {
    timer(PRODUCTS_POLL_INTERVAL_MS, PRODUCTS_POLL_INTERVAL_MS).pipe(
      switchMap(() =>
        this.productApi.getProductsMeta().pipe(catchError(() => EMPTY))
      ),
      map(meta => meta.productsUpdatedAt),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(() => this.loadProducts());
  }
}
