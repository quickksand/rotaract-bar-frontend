import {Component, inject, OnInit, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {CurrencyPipe, DatePipe, NgTemplateOutlet} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {PurchaseOrderDto} from '../api/generated-api/models';
import {FailedOrderEntry, OfflineQueueService, QueuedOrder} from '../services/offline-capability/offlineQueue.service';
import {ProductsService} from '../services/drinks/products.service';
import {PRICING} from '../constants/pricing.constants';

interface OrderSummary {
  itemTotal: number;
  depositTotal: number;
  returnedCupsCredit: number;
  tip: number;
  grandTotal: number;
}

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  imports: [DatePipe, CurrencyPipe, NgTemplateOutlet, MatButtonModule],
})
export class StatusComponent implements OnInit {
  private offlineQueue = inject(OfflineQueueService);
  private products = inject(ProductsService);

  queueLength = toSignal(this.offlineQueue.queueLength, { initialValue: 0 });
  pendingOrders = signal<QueuedOrder[]>([]);
  failedOrders = signal<FailedOrderEntry[]>([]);
  expandedIndices = signal<Set<string>>(new Set());

  ngOnInit() {
    this.reload();
  }

  isExpanded(id: string): boolean {
    return this.expandedIndices().has(id);
  }

  toggleExpanded(id: string) {
    const next = new Set(this.expandedIndices());
    next.has(id) ? next.delete(id) : next.add(id);
    this.expandedIndices.set(next);
  }

  collapseAll() {
    this.expandedIndices.set(new Set());
  }

  productName(productId: number | undefined): string {
    if (productId == null) return 'Unbekannt';
    return this.products.getProductById(productId)?.name ?? `Produkt #${productId}`;
  }

  summaryOf(order: PurchaseOrderDto): OrderSummary {
    let itemTotal = 0;
    let depositTotal = 0;

    for (const item of order.items ?? []) {
      const product = item.productId != null ? this.products.getProductById(item.productId) : undefined;
      const qty = item.quantity ?? 0;

      itemTotal += item.customPrice != null
        ? item.customPrice
        : (product?.price ?? 0) * qty;

      if (product?.category !== 'SHOTS') {
        depositTotal += PRICING.DEPOSIT_AMOUNT * qty;
      }
    }

    const returnedCupsCredit = (order.returnedCupsCount ?? 0) * PRICING.DEPOSIT_AMOUNT;
    const tip = order.tipAmount ?? 0;
    const freeDrinkDiscount = order.freeDrinkDiscount ?? 0;

    return {
      itemTotal,
      depositTotal,
      returnedCupsCredit,
      tip,
      grandTotal: itemTotal + depositTotal - returnedCupsCredit - freeDrinkDiscount + tip,
    };
  }

  clearFailedOrders() {
    this.offlineQueue.clearFailedOrders().then(() => this.failedOrders.set([]));
  }

  private reload() {
    Promise.all([
      this.offlineQueue.getPendingOrders(),
      this.offlineQueue.getFailedOrders(),
    ]).then(([pending, failed]) => {
      this.pendingOrders.set(pending);
      this.failedOrders.set(failed);
    });
  }
}
