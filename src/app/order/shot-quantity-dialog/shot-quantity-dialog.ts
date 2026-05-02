import {Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {CurrencyPipe} from '@angular/common';
import {Product} from '../../api/generated-api/models/product';

export interface ShotQuantityDialogData {
  product: Product;
}

@Component({
  selector: 'app-shot-quantity-dialog',
  imports: [MatDialogModule, MatButtonModule, CurrencyPipe],
  templateUrl: './shot-quantity-dialog.html',
})
export class ShotQuantityDialog {

  protected data = inject<ShotQuantityDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ShotQuantityDialog, number>);

  protected quantity = 1;

  protected get isMexikaner(): boolean {
    return this.data.product.name?.toLowerCase().includes('mexikaner') ?? false;
  }

  protected get quickPicks(): number[] {
    return this.isMexikaner ? [1, 2, 4, 6, 10] : [1, 2, 4, 6];
  }

  setQuantity(n: number): void {
    this.quantity = Math.max(1, Math.min(99, n));
  }

  clearQuantity(): void {
    this.quantity = 1;
  }

  confirm(): void {
    this.dialogRef.close(this.quantity);
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
