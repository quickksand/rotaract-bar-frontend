import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {EvaluationSummaryDto} from '../../api/generated-api/models/evaluation-summary-dto';

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './kpi-cards.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCardsComponent {
  @Input({required: true}) summary!: EvaluationSummaryDto | null;
}
