import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {CategoryDisplayPipe} from '../../order/category-display.pipe';
import {EvaluationService} from '../evaluation.service';
import {ProductSalesEntryDto} from '../../api/generated-api/models/product-sales-entry-dto';

type RankingMode = 'top' | 'flop';

@Component({
  selector: 'app-drink-ranking',
  standalone: true,
  imports: [DecimalPipe, CategoryDisplayPipe],
  templateUrl: './drink-ranking.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrinkRankingComponent {
  private readonly evaluationService = inject(EvaluationService);

  readonly mode = signal<RankingMode>('top');

  private readonly top = toSignal(this.evaluationService.topProducts$, {initialValue: [] as ProductSalesEntryDto[]});
  private readonly flop = toSignal(this.evaluationService.flopProducts$, {initialValue: [] as ProductSalesEntryDto[]});

  readonly entries = computed(() => this.mode() === 'top' ? this.top() : this.flop());

  setMode(mode: RankingMode): void {
    this.mode.set(mode);
  }
}
