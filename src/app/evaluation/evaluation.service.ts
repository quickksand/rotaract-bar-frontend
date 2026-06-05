import {inject, Injectable} from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  EMPTY,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap
} from 'rxjs';
import {EvaluationControllerService} from '../api/generated-api/services/evaluation-controller.service';
import {PurchaseOrderControllerService} from '../api/generated-api/services/purchase-order-controller.service';
import {EvaluationSummaryDto} from '../api/generated-api/models/evaluation-summary-dto';
import {ProductSalesEntryDto} from '../api/generated-api/models/product-sales-entry-dto';
import {PurchaseOrderDto} from '../api/generated-api/models/purchase-order-dto';

export interface EventDay {
  date: Date;
  orderCount: number;
}

@Injectable({providedIn: 'root'})
export class EvaluationService {
  private readonly evaluationApi = inject(EvaluationControllerService);
  private readonly orderApi = inject(PurchaseOrderControllerService);

  private readonly _year$ = new BehaviorSubject<number | null>(new Date().getFullYear());
  private readonly _dayIndex$ = new BehaviorSubject<number | null>(null);
  private readonly _startCups$ = new BehaviorSubject<number>(0);
  private readonly _depositAmountPerCup$ = new BehaviorSubject<number>(1.0);

  private _autoSelectedYear = false;
  private _autoSelectedDay = false;

  private readonly _refresh$ = new BehaviorSubject<number>(0);
  private readonly _error$ = new BehaviorSubject<boolean>(false);
  private readonly _loading$ = new BehaviorSubject<boolean>(false);

  readonly year$ = this._year$.asObservable();
  readonly dayIndex$ = this._dayIndex$.asObservable();
  readonly startCups$ = this._startCups$.asObservable();
  readonly depositAmountPerCup$ = this._depositAmountPerCup$.asObservable();
  readonly error$ = this._error$.asObservable();
  readonly loading$ = this._loading$.asObservable();

  private readonly allOrders$: Observable<PurchaseOrderDto[]> = this._refresh$.pipe(
    switchMap(() =>
      this.orderApi.getOrders().pipe(
        tap(() => this._error$.next(false)),
        catchError(() => {
          this._error$.next(true);
          return of([] as PurchaseOrderDto[]);
        })
      )
    ),
    shareReplay({bufferSize: 1, refCount: true})
  );

  readonly availableYears$: Observable<number[]> = this.allOrders$.pipe(
    map(orders => {
      const years = new Set<number>();
      orders.forEach(o => {
        if (o.orderedAt) years.add(new Date(o.orderedAt).getFullYear());
      });
      return Array.from(years).sort((a, b) => b - a);
    }),
    tap(years => this.autoSelectYear(years)),
    shareReplay({bufferSize: 1, refCount: true})
  );

  readonly availableDays$: Observable<EventDay[]> = combineLatest([
    this.allOrders$,
    this._year$,
  ]).pipe(
    map(([orders, year]) => {
      const dayMap = new Map<string, EventDay>();
      orders
        .filter(o => o.orderedAt && (!year || new Date(o.orderedAt).getFullYear() === year))
        .forEach(o => {
          const d = new Date(o.orderedAt!);
          const day0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const key = day0.toISOString();
          const existing = dayMap.get(key);
          if (existing) existing.orderCount++;
          else dayMap.set(key, {date: day0, orderCount: 1});
        });
      return Array.from(dayMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    }),
    tap(days => this.autoSelectDay(days)),
    shareReplay({bufferSize: 1, refCount: true})
  );

  private readonly dateRange$: Observable<{from?: string; to?: string}> = combineLatest([
    this.availableDays$,
    this._dayIndex$,
  ]).pipe(
    map(([days, idx]) => {
      if (idx == null || !days[idx]) return {};
      const start = new Date(days[idx].date);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return {from: start.toISOString(), to: end.toISOString()};
    })
  );

  readonly summary$: Observable<EvaluationSummaryDto | null> = combineLatest([
    this._year$,
    this.dateRange$,
    this._startCups$,
    this._depositAmountPerCup$,
    this._refresh$,
  ]).pipe(
    tap(() => {
      this._loading$.next(true);
    }),
    switchMap(([year, range, startCups, depositAmountPerCup]) =>
      this.evaluationApi.getEvaluationSummary({
        year: year ?? undefined,
        from: range.from,
        to: range.to,
        startCups,
        depositAmountPerCup,
      }).pipe(
        tap(() => {
          this._loading$.next(false);
          this._error$.next(false);
        }),
        catchError(() => {
          this._loading$.next(false);
          this._error$.next(true);
          return EMPTY;
        })
      )
    ),
    shareReplay({bufferSize: 1, refCount: true})
  );

  readonly topProducts$ = this.buildProductRanking('desc');
  readonly flopProducts$ = this.buildProductRanking('asc');

  selectYear(year: number | null): void {
    this._year$.next(year);
    this._dayIndex$.next(null);
  }

  selectDay(idx: number | null): void {
    this._dayIndex$.next(idx);
  }

  setStartCups(n: number): void {
    this._startCups$.next(Math.max(0, n));
  }

  setDepositAmountPerCup(n: number): void {
    this._depositAmountPerCup$.next(Math.max(0, n));
  }

  refresh(): void {
    this._refresh$.next(this._refresh$.value + 1);
  }

  private buildProductRanking(sortOrder: 'asc' | 'desc'): Observable<ProductSalesEntryDto[]> {
    return combineLatest([
      this._year$,
      this.dateRange$,
      this._refresh$,
    ]).pipe(
      switchMap(([year, range]) =>
        this.evaluationApi.getTopProducts({
          year: year ?? undefined,
          from: range.from,
          to: range.to,
          limit: 10,
          sortOrder,
        }).pipe(
          catchError(() => of([] as ProductSalesEntryDto[]))
        )
      ),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  /**
   * On first data load: select current year if it exists in data, otherwise fall back to "Alle".
   */
  private autoSelectYear(years: number[]): void {
    if (this._autoSelectedYear) return;
    this._autoSelectedYear = true;
    const currentYear = new Date().getFullYear();
    if (years.includes(currentYear)) {
      this._year$.next(currentYear);
    } else {
      this._year$.next(null);
    }
  }

  /**
   * On first data load (or when year changes and day hasn't been manually set):
   * select today if it exists in data, otherwise fall back to "Alle Tage".
   */
  private autoSelectDay(days: EventDay[]): void {
    if (this._autoSelectedDay) return;
    this._autoSelectedDay = true;
    const today = new Date();
    const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const idx = days.findIndex(d => d.date.getTime() === todayKey);
    this._dayIndex$.next(idx >= 0 ? idx : null);
  }
}
