import {Component, ElementRef, input, ViewChild} from '@angular/core';
import {Product} from '../../api/generated-api/models/product';
import {ProductCard} from './product-card/product-card';

@Component({
  selector: 'app-product-category-section',
  standalone: true,
  imports: [
    ProductCard
  ],
  templateUrl: './product-category-section.component.html',
  styleUrl: './product-category-section.component.css'
})
export class ProductCategorySection {

  categoryTitle = input.required<String>();
  products = input.required<Product[]>();

  @ViewChild('carousel') carousel!: ElementRef;

  onSwipeLeft() {
    this.carousel.nativeElement.scrollBy({ left: 500, behavior: 'smooth' });
  }

  onSwipeRight() {
    this.carousel.nativeElement.scrollBy({ left: -500, behavior: 'smooth' });
  }

}
