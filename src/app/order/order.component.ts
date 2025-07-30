import {Component, inject} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {MatButton} from '@angular/material/button';
import {OrderSummary} from './order-summary/order-summary';
import {map, Observable, tap} from 'rxjs';
import {ProductDto} from '../api/api-client/dtos';
import {OrderService} from '../services/order.service';
import {ProductsService} from '../services/products.service';
import {HttpClient} from '@angular/common/http';
import {toSignal} from '@angular/core/rxjs-interop';
import {ProductCategorySection} from './product-category-section/product-category-section.component';
import {CategoryDisplayPipe} from './category-display.pipe';

export interface OrderedItem {
  productId: number,
  quantity: number
}


@Component({
  selector: 'app-order',
  imports: [
    AsyncPipe,
    MatButton,
    OrderSummary,
    ProductCategorySection,
    CategoryDisplayPipe
  ],
  templateUrl: './order.component.html',
  styleUrl: './order.component.css'
})
export class OrderComponent {
  protected orderService = inject(OrderService);
  protected productService = inject(ProductsService);

  protected products$: Observable<ProductDto[]>;
  protected categories$;

  protected products = toSignal(this.productService.products$, {initialValue: []})

  constructor(private http: HttpClient) {
    this.products$ = this.productService.products$;
    this.categories$ = this.products$.pipe(
      map(products => {
        // Set für unique categories, dann zu Array
        console.log(products)
        return [...new Set(
          products.map(product => product.category)
        )];
      })
    );
  }

  onSendOrder() {
    const newOrder = this.orderService.convertToPurchaseOrderDto();
    this.http.post<void>('api/orders', newOrder)
      .pipe(
        tap(() => this.orderService.clearOrder())
      )
      .subscribe((res) => console.log('POST RESPONSE ', res))
  }

}
