import {Component, inject, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {filter, forkJoin, take} from 'rxjs';
import {MatButton} from '@angular/material/button';
import {DecimalPipe} from '@angular/common';
import {ProductDto} from '../api/generated-api/models';
import {ProductControllerService} from '../api/generated-api/services';
import {ProductsService} from '../services/drinks/products.service';
import {AdminAuthService} from '../services/admin-auth.service';
import {CategoryDisplayPipe} from '../order/category-display.pipe';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, MatButton, CategoryDisplayPipe, DecimalPipe],
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
  editedOutOfStock: Record<number, boolean> = {};

  loading = true;
  saving = false;
  saveError = false;
  resetting = false;

  ngOnInit(): void {
    this.productsService.products$.pipe(
      filter(p => !!p),
      take(1)
    ).subscribe(products => {
      this.products = products!;
      products!.forEach(p => {
        this.editedPrices[p.id] = p.price;
        this.editedOutOfStock[p.id] = p.outOfStock ?? false;
      });
      this.loading = false;
    });
  }

  getProductsByCategory(category: string): ProductDto[] {
    return this.products.filter(p => p.category === category);
  }

  get isValid(): boolean {
    return Object.values(this.editedPrices).every(p => typeof p === 'number' && p > 0);
  }

  save(): void {
    const changes = this.products
      .filter(p =>
        this.editedPrices[p.id] !== p.price ||
        this.editedOutOfStock[p.id] !== (p.outOfStock ?? false)
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
  // TODO LEON redundanter Code für Update Products; (loadProducts reicht, für Cache wichtig)
        // this.products.forEach(p => {
        //   p.price = this.editedPrices[p.id];
        //   p.outOfStock = this.editedOutOfStock[p.id];
        // });
        this.productsService.loadProducts();
        this.saving = false;
      },
      error: () => {
        this.saving = false;
        this.saveError = true;
      }
    });
  }

  resetToDefaults(): void {
    this.resetting = true;
    this.saveError = false;

    this.productApi.resetProducts().subscribe({
      next: (resetProducts) => {
        this.products = resetProducts;
        resetProducts.forEach(p => {
          this.editedPrices[p.id] = p.price;
          this.editedOutOfStock[p.id] = p.outOfStock ?? false;
        });
        this.productsService.loadProducts();
        this.resetting = false;
      },
      error: () => {
        this.resetting = false;
        this.saveError = true;
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }
}
