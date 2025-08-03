import {Component, inject} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {MatButton} from '@angular/material/button';
import {OrderSummary} from './order-summary/order-summary';
import {map, Observable, tap} from 'rxjs';
import {ProductDto} from '../api/api-client/dtos';
import {OrderService} from '../services/order.service';
import {ProductsService} from '../services/products.service';
import {HttpClient} from '@angular/common/http';
import {ProductCategorySection} from './product-category-section/product-category-section.component';
import {CategoryDisplayPipe} from './category-display.pipe';
import {DepositSection} from './deposit-section/deposit-section';
import {StampCardSection} from './stamp-card-section/stamp-card-section';

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
    CategoryDisplayPipe,
    DepositSection,
    StampCardSection
  ],
  templateUrl: './order.component.html',
  styleUrl: './order.component.css'
})
export class OrderComponent {
  protected orderService = inject(OrderService);
  protected productService = inject(ProductsService);

  protected products$: Observable<ProductDto[] | undefined>;
  protected categories$;

  constructor(private http: HttpClient) {
    this.products$ = this.productService.products$;
    this.categories$ = this.products$.pipe(
      map(products => {
        return [...new Set(
          products?.map(product => product.category)
        )];
      })
    );
  }

  onSendOrder() {
    const newOrder = this.orderService.convertToPurchaseOrderDto();
    this.http.post<void>('api/orders', newOrder)
      .pipe(
        tap(() => this.orderService.submitOrderToPreparation())
      )
      .subscribe((res) => console.log('POST RESPONSE ', res))
  }

}
