import {Component, inject, input} from '@angular/core';
import {Product} from '../../../api/generated-api/models/product';
import {CurrencyPipe} from '@angular/common';
import {MatCard, MatCardHeader, MatCardSubtitle, MatCardTitle} from '@angular/material/card';
import {OrderService} from '../../../services/order.service';

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


}
