import {inject, Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {ProductDto} from '../api/api-client/dtos';
import {HttpClient} from '@angular/common/http';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: "root"
})
export class ProductsService {

  private http = inject(HttpClient);
  private _products$ = new BehaviorSubject<ProductDto[] | undefined>(undefined);

  constructor() {
    this.http.get<ProductDto[]>('/api/products')
      .pipe(
        takeUntilDestroyed()
      )
      .subscribe(
        products => this._products$.next(products)
      );
  }

  get products$() {
    return this._products$.asObservable();
  }

  public getProductById(productId: number){
    return this._products$.getValue()!.find(product => product.id === productId)
  }

  public getProductsByCategory(category: string): ProductDto[] {
    return this._products$.getValue()!.filter(p => p.category === category);

  }
}
