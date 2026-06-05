import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {Router} from '@angular/router';
import {DatePipe} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatButton} from '@angular/material/button';
import {AdminAuthService} from '../services/admin-auth.service';
import {EvaluationService} from './evaluation.service';
import {KpiCardsComponent} from './kpi-cards/kpi-cards.component';
import {DrinkRankingComponent} from './drink-ranking/drink-ranking.component';

@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [DatePipe, MatButton, KpiCardsComponent, DrinkRankingComponent],
  templateUrl: './evaluation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvaluationComponent {
  private readonly evaluationService = inject(EvaluationService);
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);

  readonly year = toSignal(this.evaluationService.year$, {initialValue: null as number | null});
  readonly dayIndex = toSignal(this.evaluationService.dayIndex$, {initialValue: null as number | null});
  readonly startCups = toSignal(this.evaluationService.startCups$, {initialValue: 0});
  readonly depositAmount = toSignal(this.evaluationService.depositAmountPerCup$, {initialValue: 1.0});
  readonly summary = toSignal(this.evaluationService.summary$, {initialValue: null});
  readonly availableYears = toSignal(this.evaluationService.availableYears$, {initialValue: [] as number[]});
  readonly availableDays = toSignal(this.evaluationService.availableDays$, {initialValue: [] as {date: Date; orderCount: number}[]});
  readonly loading = toSignal(this.evaluationService.loading$, {initialValue: false});
  readonly error = toSignal(this.evaluationService.error$, {initialValue: false});

  onYearChange(value: string): void {
    this.evaluationService.selectYear(value === '' ? null : Number(value));
  }

  onDayChange(value: string): void {
    this.evaluationService.selectDay(value === '' ? null : Number(value));
  }

  onStartCupsChange(value: string): void {
    const parsed = Number(value);
    this.evaluationService.setStartCups(isFinite(parsed) ? parsed : 0);
  }

  onDepositChange(value: string): void {
    const parsed = Number(value);
    this.evaluationService.setDepositAmountPerCup(isFinite(parsed) ? parsed : 0);
  }

  refresh(): void {
    this.evaluationService.refresh();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }
}
