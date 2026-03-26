import {Component, Input} from '@angular/core';
import {CurrencyPipe} from '@angular/common';
import {EvaluationSummary} from '../../api/generated-api/models/evaluation-summary';

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './kpi-cards.component.html',
})
export class KpiCardsComponent {
  @Input() summary!: EvaluationSummary;
}
