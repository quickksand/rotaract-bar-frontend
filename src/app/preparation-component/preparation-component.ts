// preparation.component.ts
import {Component, inject} from '@angular/core';
import {AsyncPipe, CurrencyPipe} from '@angular/common';
import {OrderService} from '../services/order.service';

@Component({
  selector: 'app-preparation',
  templateUrl: './preparation-component.html',
  imports: [
    CurrencyPipe,
    AsyncPipe
  ],
  styleUrls: ['./preparation-component.css']
})
export class PreparationComponent {

  protected orderService = inject(OrderService);

  get activeOrders() {
    return this.orderService.activePreparationOrders$;
  }

  startOrder(orderId: number) {
    this.orderService.startPrepOrder(orderId);
  }

  startItem(orderId: number, itemIndex: number) {
    this.orderService.startPrepItem(orderId, itemIndex);
  }

  finishItem(orderId: number, itemIndex: number) {
    this.orderService.finishPrepItem(orderId, itemIndex);
  }

  finishOrder(orderId: number) {
    this.orderService.finishPrepOrder(orderId);
  }
}
