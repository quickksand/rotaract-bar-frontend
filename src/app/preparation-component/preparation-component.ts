// preparation.component.ts
import {Component, inject} from '@angular/core';
import {AsyncPipe, CurrencyPipe} from '@angular/common';
import {OrderService} from '../services/order.service';

interface MockOrder {
  id: number;
  orderNumber: string;
  status: 'OFFEN' | 'IN_ARBEIT' | 'FERTIG';
  timeAgo: string;
  total: number;
  items: MockOrderItem[];
}

interface MockOrderItem {
  name: string;
  quantity: number;
  status: 'OFFEN' | 'IN_ARBEIT' | 'FERTIG';  // Statt boolean
  ingredients?: string[];
}

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

  mockOrders: MockOrder[] = [
    {
      id: 23,
      orderNumber: '#23',
      status: 'OFFEN',
      timeAgo: 'vor 2 Min',
      total: 25.00,
      items: [
        { name: '2x Cuba Libre', quantity: 2, status: 'OFFEN', ingredients: ['Rum', 'Cola', 'Limette'] },
        { name: '1x Bier 0,33', quantity: 1, status: 'OFFEN' }
      ]
    },
    {
      id: 22,
      orderNumber: '#22',
      status: 'IN_ARBEIT',
      timeAgo: 'vor 5 Min',
      total: 18.50,
      items: [
        { name: '1x Gin Tonic', quantity: 1, status: 'IN_ARBEIT', ingredients: ['Gin', 'Tonic Water', 'Limette'] },
        { name: '2x Aperol Spritz', quantity: 2, status: 'FERTIG', ingredients: ['Aperol', 'Prosecco', 'Soda'] }
      ]
    }
  ];

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
