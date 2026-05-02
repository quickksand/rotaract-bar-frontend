import {Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {CurrencyPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Product} from '../../api/generated-api/models/product';

export interface ShotQuantityDialogData {
  product: Product;
}

export interface ShotQuantityDialogResult {
  quantity: number;
  bottleSale: boolean;
  customPrice?: number;
}

@Component({
  selector: 'app-shot-quantity-dialog',
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, CurrencyPipe, FormsModule],
  templateUrl: './shot-quantity-dialog.html',
})
export class ShotQuantityDialog {

  protected data = inject<ShotQuantityDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ShotQuantityDialog, ShotQuantityDialogResult>);

  protected quantity = 1;
  protected bottleSale = false;
  protected bottlePrice: number | null = null;

  protected readonly BOTTLE_QUANTITY = 25;
  protected readonly BOTTLE_MIN_PRICE = 50;

  protected get isMexikaner(): boolean {
    return this.data.product.name?.toLowerCase().includes('mexikaner') ?? false;
  }

  protected get quickPicks(): number[] {
    return this.isMexikaner ? [1, 2, 4, 6, 10] : [1, 2, 4, 6];
  }

  protected get confirmDisabled(): boolean {
    return this.bottleSale && (this.bottlePrice == null || this.bottlePrice < this.BOTTLE_MIN_PRICE);
  }

  setQuantity(n: number): void {
    this.quantity = Math.max(1, Math.min(99, n));
  }

  clearQuantity(): void {
    this.quantity = 1;
  }

  toggleBottleSale(): void {
    this.bottleSale = !this.bottleSale;
    if (!this.bottleSale) {
      this.bottlePrice = null;
    }
  }

  confirm(): void {
    if (this.bottleSale) {
      this.dialogRef.close({ quantity: this.BOTTLE_QUANTITY, bottleSale: true, customPrice: this.bottlePrice! });
    } else {
      this.dialogRef.close({ quantity: this.quantity, bottleSale: false });
    }
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
