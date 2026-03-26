import {inject, Injectable} from '@angular/core';
import {Observable, shareReplay} from 'rxjs';
import {PurchaseOrderControllerService} from '../api/generated-api/services/purchase-order-controller.service';
import {EvaluationControllerService} from '../api/generated-api/services/evaluation-controller.service';
import {PurchaseOrder} from '../api/generated-api/models/purchase-order';
import {EvaluationSummary} from '../api/generated-api/models/evaluation-summary';
import {ProductSalesEntry} from '../api/generated-api/models/product-sales-entry';
import {GetEvaluationSummary$Params} from '../api/generated-api/fn/evaluation-controller/get-evaluation-summary';
import {GetTopProducts$Params} from '../api/generated-api/fn/evaluation-controller/get-top-products';

export interface ProductSalesEntryWithShare extends ProductSalesEntry {
  relativeShare: number;
}

export interface DateRange {
  from: string;
  to: string;
}

@Injectable({ providedIn: 'root' })
export class EvaluationService {
  private orderService = inject(PurchaseOrderControllerService);
  private evalController = inject(EvaluationControllerService);

  /** All orders loaded once for year/day detection – cached for the session. */
  readonly allOrders$ = this.orderService.getOrders().pipe(shareReplay(1));

  getAvailableYears(orders: PurchaseOrder[]): number[] {
    const years = new Set(
      orders
        .filter(o => !!o.orderedAt)
        .map(o => new Date(o.orderedAt!).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  }

  /** Returns unique calendar days (sorted asc) from the given orders. */
  detectEventDays(orders: PurchaseOrder[]): Date[] {
    const seen = new Set<string>();
    return orders
      .filter(o => !!o.orderedAt)
      .map(o => {
        const d = new Date(o.orderedAt!);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      })
      .filter(d => {
        const key = d.toDateString();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.getTime() - b.getTime());
  }

  filterOrdersByYear(orders: PurchaseOrder[], year: number): PurchaseOrder[] {
    return orders.filter(o => !!o.orderedAt && new Date(o.orderedAt).getFullYear() === year);
  }

  toDateRange(day: Date): DateRange {
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = day.getFullYear();
    const m = pad(day.getMonth() + 1);
    const d = pad(day.getDate());
    return {
      from: `${y}-${m}-${d}T00:00:00`,
      to: `${y}-${m}-${d}T23:59:59.999`,
    };
  }

  getSummary(params: GetEvaluationSummary$Params): Observable<EvaluationSummary> {
    return this.evalController.getEvaluationSummary(params);
  }

  getTopProducts(params: GetTopProducts$Params): Observable<ProductSalesEntryWithShare[]> {
    return new Observable(observer => {
      this.evalController.getTopProducts(params).subscribe({
        next: entries => {
          const max = Math.max(1, ...entries.map(e => e.totalQuantitySold ?? 0));
          observer.next(entries.map(e => ({
            ...e,
            relativeShare: (e.totalQuantitySold ?? 0) / max,
          })));
          observer.complete();
        },
        error: err => observer.error(err),
      });
    });
  }
}
