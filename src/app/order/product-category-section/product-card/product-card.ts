import {Component, computed, DestroyRef, ElementRef, inject, input, ViewChild} from '@angular/core';
import {ProductDto} from '../../../api/generated-api/models';
import {CurrencyPipe} from '@angular/common';
import {MatCard, MatCardHeader, MatCardSubtitle, MatCardTitle} from '@angular/material/card';
import {OrderService} from '../../../services/order.service';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {filter, fromEvent, merge, switchMap, takeUntil, tap, timer} from 'rxjs';
import {ShotQuantityDialog, ShotQuantityDialogResult} from '../../shot-quantity-dialog/shot-quantity-dialog';
import {MatDialog} from '@angular/material/dialog';

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

  private destroyRef = inject(DestroyRef);

  product = input.required<ProductDto>();

  longPressEnabled = input.required<Boolean>()
  @ViewChild(MatCard, { read: ElementRef })
  matCard!: ElementRef<HTMLElement>;
  private longPressTriggered = false;

  protected orderService = inject(OrderService);
  private dialog = inject(MatDialog);
  private orderSignal = toSignal(this.orderService.currentOrder$);
  quantity = computed(() => {
    const order = this.orderSignal();
    const productId = this.product().id;
    return order!.find(item => item.productId === productId)?.quantity || 0;
  });

  ngAfterViewInit() {
    if (this.longPressEnabled()) {

      const pointerDown$ = fromEvent(this.matCard.nativeElement, 'pointerdown');
      const pointerUp$ = fromEvent(this.matCard.nativeElement, 'pointerup');
      const pointerLeave$ = fromEvent(this.matCard.nativeElement, 'pointerleave');
      const pointerCancel$ = fromEvent(this.matCard.nativeElement, 'pointercancel');

      const cancel$ = merge(pointerUp$, pointerLeave$, pointerCancel$);

      pointerDown$
        .pipe(
          switchMap(() =>
            timer(500).pipe(
              takeUntil(cancel$)
            )
          ),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          this.longPressTriggered = true;
          this.openDialog();
        });
    }
  }

  private openDialog(): void {
    const ref = this.dialog.open(ShotQuantityDialog, { data: { product: this.product() } });
    ref.afterClosed()
      .pipe(
        tap(_ => this.longPressTriggered = false),
        filter((r): r is ShotQuantityDialogResult => r !== undefined))
      .subscribe(({ quantity, bottleSale, customPrice }) => {
        this.orderService.addToOrder(this.product().id!, quantity, bottleSale, customPrice);
      });
  }

  onCardClick() {
    if (this.longPressTriggered) { this.longPressTriggered = false; return; }
    this.orderService.addToOrder(this.product().id!);
  }

  }
