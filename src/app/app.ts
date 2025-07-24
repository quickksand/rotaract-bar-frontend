import {Component, inject, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, tap} from 'rxjs';
import {AsyncPipe, CurrencyPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle} from '@angular/material/card';
import {MatButton} from '@angular/material/button';
import {OrderSummary} from './order-summary/order-summary';
import {ProductDto} from './api/api-client/dtos';
import {OrderService} from './order.service';
import {ProductsService} from './products.service';

// interface Product {
//   id: number,
//   name: string,
//   price: number,
// }

export interface OrderedItem {
  productId: number,
  quantity: number
}


@Component({
  selector: 'app-root',
  imports: [
    AsyncPipe,
    FormsModule,
    MatCard,
    MatCardTitle,
    MatCardSubtitle,
    MatCardHeader,
    MatCardContent,
    CurrencyPipe,
    MatButton,
    OrderSummary
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected products$ = new Observable<ProductDto[]>();

  protected orderService = inject(OrderService);
  protected productService = inject(ProductsService);

  constructor(private http: HttpClient) {
  }

  ngOnInit() {
    this.products$ = this.productService.products$;
  }

  onSendOrder() {
    const newOrder = this.orderService.convertToPurchaseOrderDto();
    this.http.post<void>('api/orders', newOrder)
      .pipe(
        tap(() => this.orderService.clearOrder())
      )
      .subscribe((res) => console.log('POST RESPONSE ', res))
  }

  onTestGetAll() {
    this.http.get('/api/orders')
      .subscribe((res) => console.log('GET RESPONSE', res));
  }
}
