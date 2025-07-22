import {Component, inject} from '@angular/core';
import {OrderedItem} from '../app';
import {OrderService} from '../order.service';
import {Observable} from 'rxjs';
import {AsyncPipe, JsonPipe} from '@angular/common';

@Component({
  selector: 'app-order-summary',
  imports: [
    AsyncPipe,
    JsonPipe
  ],
  templateUrl: './order-summary.html',
  styleUrl: './order-summary.css'
})
export class OrderSummary {

  //hole dir ordersummary - entweder service (präferiert) oder input signals
  // bei änderung an bestellung soll auch ein getOrder ausgeführt werden
  // currentOrder = input<OrderedItem[]>()

  protected orderService = inject(OrderService);
  protected currentOrder$ = new Observable<OrderedItem[]>()

  constructor() {
    this.currentOrder$ = this.orderService.getCurrentOrder();
  }

}
