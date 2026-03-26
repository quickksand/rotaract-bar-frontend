import {Component, Input} from '@angular/core';
import {CurrencyPipe} from '@angular/common';
import {ProductSalesEntryWithShare} from '../evaluation.service';

@Component({
  selector: 'app-drink-ranking',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './drink-ranking.component.html',
})
export class DrinkRankingComponent {
  @Input() topProducts: ProductSalesEntryWithShare[] = [];

  showAll = false;

  get visibleProducts(): ProductSalesEntryWithShare[] {
    return this.showAll ? this.topProducts : this.topProducts.slice(0, 10);
  }

  categoryLabel(category: string | undefined): string {
    switch (category) {
      case 'DRINKS': return 'Cocktails';
      case 'BEER_WINE_NONALC': return 'Bier / Wein';
      case 'SHOTS': return 'Shots';
      default: return category ?? '–';
    }
  }
}
