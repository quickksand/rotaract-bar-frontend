import {Component, inject} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {BehaviorSubject, combineLatest, map, switchMap} from 'rxjs';
import {EvaluationService, ProductSalesEntryWithShare} from './evaluation.service';
import {EvaluationSummary} from '../api/generated-api/models/evaluation-summary';
import {KpiCardsComponent} from './kpi-cards/kpi-cards.component';
import {DrinkRankingComponent} from './drink-ranking/drink-ranking.component';

interface EvaluationViewModel {
  summary: EvaluationSummary;
  topProducts: ProductSalesEntryWithShare[];
  availableYears: number[];
  availableDays: Date[];
  selectedYear: number | null;
  selectedDay: number | null;
}

@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [AsyncPipe, KpiCardsComponent, DrinkRankingComponent],
  templateUrl: './evaluation.component.html',
})
export class EvaluationComponent {
  private evaluationService = inject(EvaluationService);

  readonly selectedYear$ = new BehaviorSubject<number | null>(null);
  readonly selectedDay$ = new BehaviorSubject<number | null>(null);

  readonly vm$ = combineLatest([
    this.evaluationService.allOrders$,
    this.selectedYear$,
    this.selectedDay$,
  ]).pipe(
    switchMap(([allOrders, year, day]) => {
      const availableYears = this.evaluationService.getAvailableYears(allOrders);
      const ordersForYear = year
        ? this.evaluationService.filterOrdersByYear(allOrders, year)
        : allOrders;
      const availableDays = this.evaluationService.detectEventDays(ordersForYear);

      const dateRange = day != null && availableDays[day - 1]
        ? this.evaluationService.toDateRange(availableDays[day - 1])
        : null;

      const params = {
        year: year ?? undefined,
        from: dateRange?.from,
        to: dateRange?.to,
      };

      return combineLatest([
        this.evaluationService.getSummary(params),
        this.evaluationService.getTopProducts(params),
      ]).pipe(
        map(([summary, topProducts]) => ({
          summary,
          topProducts,
          availableYears,
          availableDays,
          selectedYear: year,
          selectedDay: day,
        } satisfies EvaluationViewModel))
      );
    })
  );

  selectYear(year: number | null): void {
    this.selectedYear$.next(year);
    this.selectedDay$.next(null);
  }

  selectDay(day: number | null): void {
    this.selectedDay$.next(day);
  }
}
