import {Component, inject, input} from '@angular/core';
import {Product} from '../../api/generated-api/models/product';
import {CurrencyPipe} from '@angular/common';
import {MatCard} from '@angular/material/card';
import {OrderService} from '../../services/order.service';

@Component({
  selector: 'app-product-category-section',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatCard
  ],
  templateUrl: './product-category-section.component.html',
  styleUrl: './product-category-section.component.css'
})
export class ProductCategorySection {

  categoryTitle = input.required<String>();
  products = input.required<Product[]>();

  protected orderService = inject(OrderService);

}
