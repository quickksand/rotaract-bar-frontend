import {Component, inject} from '@angular/core';
import {OrderService} from '../../services/order.service';
import {Observable} from 'rxjs';
import {AsyncPipe, CurrencyPipe} from '@angular/common';
import {ProductsService} from '../../services/products.service';
import {ProductDto} from '../../api/api-client/dtos';

@Component({
  selector: 'app-order-summary',
  imports: [
    AsyncPipe,
    CurrencyPipe
  ],
  templateUrl: './order-summary.html',
  styleUrl: './order-summary.css'
})
export class OrderSummary {
  protected readonly productsService = inject(ProductsService);
  protected readonly orderService = inject(OrderService);

  protected readonly products$: Observable<ProductDto[] | undefined>
  protected readonly currentOrder$


  constructor() {
    this.currentOrder$ = this.orderService.currentOrder$;
    this.products$ = this.productsService.products$;
  }
}
