import {Component, inject} from '@angular/core';
import {OrderService} from '../../services/order.service';
import {filter, Observable, skip} from 'rxjs';
import {AsyncPipe, CurrencyPipe} from '@angular/common';
import {ProductsService} from '../../services/products.service';
import {ProductDto} from '../../api/api-client/dtos';
import {MatChipsModule} from '@angular/material/chips';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

type TipChip = 'round-euro' | 'round-five' | 'donate-pfand';

@Component({
  selector: 'app-order-summary',
  imports: [
    AsyncPipe,
    CurrencyPipe,
    MatChipsModule,
  ],
  templateUrl: './order-summary.html',
  styleUrl: './order-summary.css'
})
export class OrderSummary {
  protected readonly productsService = inject(ProductsService);
  protected readonly orderService = inject(OrderService);

  protected readonly products$: Observable<ProductDto[] | undefined>;
  protected readonly currentOrder$;

  protected activeTipChip: TipChip | null = null;
  protected customTipInput: number | null = null;

  // Berechnete Zielbeträge für die Chips
  protected roundEuroTarget = 0;
  protected roundEuroTip = 0;
  protected roundFiveTarget = 0;
  protected roundFiveTip = 0;

  constructor() {
    this.currentOrder$ = this.orderService.currentOrder$;
    this.products$ = this.productsService.products$;

    // Chip-Werte reaktiv neu berechnen wenn sich Gesamtsumme ändert
    this.orderService.currentTotalSum$.pipe(
      takeUntilDestroyed()
    ).subscribe(total => this.recomputeTipOptions(total));

    // Chip-Auswahl zurücksetzen wenn Trinkgeld extern gelöscht wird (z.B. durch Bestelländerung)
    this.orderService.tipAmount$.pipe(
      filter(tip => tip === 0),
      skip(1),
      takeUntilDestroyed()
    ).subscribe(() => {
      this.activeTipChip = null;
      this.customTipInput = null;
    });

    // Pfand-Spenden-Chip: Betrag aktualisieren wenn Guthaben sich ändert während Chip aktiv ist
    this.orderService.creditBalance$.pipe(
      skip(1),
      takeUntilDestroyed()
    ).subscribe(credit => {
      if (this.activeTipChip === 'donate-pfand') {
        this.orderService.setTip(credit);
      }
    });
  }

  private recomputeTipOptions(total: number): void {
    const rounded = Math.round(total * 100) / 100;

    const ceilEuro = Math.ceil(rounded);
    this.roundEuroTip = Math.round((ceilEuro - rounded) * 100) / 100;
    this.roundEuroTarget = ceilEuro;

    const rawFiveTarget = Math.ceil(rounded / 5) * 5;
    const rawFiveTip = Math.round((rawFiveTarget - rounded) * 100) / 100;
    if (rawFiveTip === 0) {
      this.roundFiveTarget = rawFiveTarget + 5;
      this.roundFiveTip = 5;
    } else {
      this.roundFiveTarget = rawFiveTarget;
      this.roundFiveTip = rawFiveTip;
    }
  }

  onTipChipClick(chip: TipChip): void {
    if (this.activeTipChip === chip) {
      this.activeTipChip = null;
      this.customTipInput = null;
      this.orderService.clearTip();
      return;
    }

    this.activeTipChip = chip;
    this.customTipInput = null;

    switch (chip) {
      case 'round-euro':
        this.orderService.setTip(this.roundEuroTip);
        break;
      case 'round-five':
        this.orderService.setTip(this.roundFiveTip);
        break;
      case 'donate-pfand':
        this.orderService.setTip(this.orderService.creditBalanceValue);
        break;
    }
  }

  adjustCustomTip(delta: number): void {
    // Stepper deselektiert Preset-Chips automatisch
    this.activeTipChip = null;
    const current = this.customTipInput ?? 0;
    const next = Math.max(0, Math.round((current + delta) * 100) / 100);
    this.customTipInput = next;
    if (next > 0) {
      this.orderService.setTip(next);
    } else {
      this.orderService.clearTip();
    }
  }
}
