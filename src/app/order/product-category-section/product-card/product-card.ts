import {Component, computed, inject, input} from '@angular/core';
import {Product} from '../../../api/generated-api/models/product';
import {CurrencyPipe} from '@angular/common';
import {MatCard, MatCardHeader, MatCardSubtitle, MatCardTitle} from '@angular/material/card';
import {OrderService} from '../../../services/order.service';
import {toSignal} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-product-card',
  imports: [
    CurrencyPipe,
    MatCard,
    MatCardHeader,
    MatCardSubtitle,
    MatCardTitle
  ],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css'
})
export class ProductCard {

  product = input.required<Product>();
  protected orderService = inject(OrderService);

  private orderSignal = toSignal(this.orderService.currentOrder$);
  quantity = computed(() => {
    const order = this.orderSignal();
    const productId = this.product().id;
    return order!.find(item => item.productId === productId)?.quantity || 0;
  });

}
