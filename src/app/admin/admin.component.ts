import {Component, inject, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {filter, forkJoin, take} from 'rxjs';
import {MatButton} from '@angular/material/button';
import {ProductDto} from '../api/generated-api/models';
import {ProductControllerService} from '../api/generated-api/services';
import {ProductsService} from '../services/drinks/products.service';
import {AdminAuthService} from '../services/admin-auth.service';
import {CategoryDisplayPipe} from '../order/category-display.pipe';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, MatButton, CategoryDisplayPipe],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly productApi = inject(ProductControllerService);

  readonly categories: ProductDto['category'][] = ['DRINKS', 'BEER_WINE_NONALC', 'SHOTS'];

  products: ProductDto[] = [];
  editedPrices: Record<number, number> = {};
  originalPrices: Record<number, number> = {};
  editedOutOfStock: Record<number, boolean> = {};
  originalOutOfStock: Record<number, boolean> = {};

  loading = true;
  saving = false;
  saveError = false;

  ngOnInit(): void {
    this.productsService.products$.pipe(
      filter(p => !!p),
      take(1)
    ).subscribe(products => {
      this.products = products!;
      products!.forEach(p => {
        this.editedPrices[p.id] = p.price;
        this.originalPrices[p.id] = p.price;
        this.editedOutOfStock[p.id] = p.outOfStock ?? false;
        this.originalOutOfStock[p.id] = p.outOfStock ?? false;
      });
      this.loading = false;
    });
  }

  getProductsByCategory(category: string): ProductDto[] {
    return this.products.filter(p => p.category === category);
  }

  get isDirty(): boolean {
    return this.products.some(p =>
      this.editedPrices[p.id] !== this.originalPrices[p.id] ||
      this.editedOutOfStock[p.id] !== this.originalOutOfStock[p.id]
    );
  }

  get isValid(): boolean {
    return Object.values(this.editedPrices).every(p => typeof p === 'number' && p > 0);
  }

  save(): void {
    const changes = this.products
      .filter(p =>
        this.editedPrices[p.id] !== this.originalPrices[p.id] ||
        this.editedOutOfStock[p.id] !== this.originalOutOfStock[p.id]
      )
      .map(p =>
        this.productApi.updateProduct({
          id: p.id,
          body: {
            price: this.editedPrices[p.id],
            outOfStock: this.editedOutOfStock[p.id],
          }
        })
      );

    if (changes.length === 0) return;

    this.saving = true;
    this.saveError = false;

    forkJoin(changes).subscribe({
      next: () => {
        this.originalPrices = { ...this.editedPrices };
        this.originalOutOfStock = { ...this.editedOutOfStock };
        this.productsService.loadProducts();
        this.saving = false;
      },
      error: () => {
        this.saving = false;
        this.saveError = true;
      }
    });
  }

  reset(): void {
    this.editedPrices = { ...this.originalPrices };
    this.editedOutOfStock = { ...this.originalOutOfStock };
    this.saveError = false;
  }

  logout(): void {
    this.auth.lock();
    this.router.navigate(['/admin/login']);
  }
}
