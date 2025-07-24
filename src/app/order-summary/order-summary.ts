import {Component, inject} from '@angular/core';
import {OrderService} from '../order.service';
import {Observable} from 'rxjs';
import {AsyncPipe} from '@angular/common';
import {ProductsService} from '../products.service';
import {ProductDto} from '../api/api-client/dtos';

@Component({
  selector: 'app-order-summary',
  imports: [
    AsyncPipe
  ],
  templateUrl: './order-summary.html',
  styleUrl: './order-summary.css'
})
export class OrderSummary {
  protected readonly productsService = inject(ProductsService);
  protected readonly orderService = inject(OrderService);

  protected readonly products$: Observable<ProductDto[]>
  protected readonly currentOrder$


  constructor() {
    this.currentOrder$ = this.orderService.currentOrder$;
    this.products$ = this.productsService.products$;
  }
}
