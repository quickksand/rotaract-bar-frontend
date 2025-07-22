import {inject, Injectable} from '@angular/core';
import {shareReplay} from 'rxjs';
import {ProductDto} from './api/api-client/dtos';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: "root"
})
export class ProductsService {

  private http = inject(HttpClient);
  protected products$ = this.http.get<ProductDto[]>('/api/products').pipe(shareReplay(1));

  getProducts() {
    return this.products$;
  }
}
