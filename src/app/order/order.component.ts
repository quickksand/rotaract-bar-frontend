import {Component, inject} from '@angular/core';
import {AsyncPipe, CurrencyPipe} from '@angular/common';
import {MatButton} from '@angular/material/button';
import {OrderSummary} from './order-summary/order-summary';
import {catchError, from, map, Observable} from 'rxjs';
import {ProductDto, PurchaseOrderDto} from '../api/generated-api/models';
import {OrderService} from '../services/order.service';
import {ProductsService} from '../services/drinks/products.service';
import {HttpClient} from '@angular/common/http';
import {ProductCategorySection} from './product-category-section/product-category-section.component';
import {CategoryDisplayPipe} from './category-display.pipe';
import {DepositSection} from './deposit-section/deposit-section';
import {OfflineQueueService} from '../services/offline-capability/offlineQueue.service';

export interface OrderedItem {
  productId: number,
  quantity: number
}


@Component({
  selector: 'app-order',
  imports: [
    AsyncPipe,
    CurrencyPipe,
    MatButton,
    OrderSummary,
    ProductCategorySection,
    CategoryDisplayPipe,
    DepositSection
  ],
  templateUrl: './order.component.html',
  styleUrl: './order.component.css'
})
export class OrderComponent {
  protected orderService = inject(OrderService);
  protected productService = inject(ProductsService);
  protected offlineQueueService = inject(OfflineQueueService);

  protected mobileCartExpanded = false;

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

  onSendOrder(paymentMethod: PurchaseOrderDto['paymentMethod'] = 'CASH') {
    const newOrder = this.orderService.convertToPurchaseOrderDto(paymentMethod);
    this.http.post<void>('api/orders', newOrder)
      .pipe(
        catchError(() => from(this.offlineQueueService.enqueue(newOrder)))
      )
      .subscribe({
        next: () => {
          this.mobileCartExpanded = false;
          this.orderService.submitOrderToPreparation(paymentMethod);
        },
        error: err => console.error('Bestellung konnte weder gesendet noch gespeichert werden:', err)
      });
  }

  /** Stempelkarte aktivieren und Details aufklappen, damit der Kassierer den Status setzen kann */
  onStampCardNudge(): void {
    this.orderService.toggleStampCardEnabled();
    this.mobileCartExpanded = true;
  }

}
