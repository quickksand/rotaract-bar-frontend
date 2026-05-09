import {Component, inject} from '@angular/core';
import {OrderService} from '../../services/order.service';
import {AsyncPipe} from '@angular/common';
import {map} from 'rxjs';

@Component({
  selector: 'app-stamp-card-section',
  imports: [
    AsyncPipe
  ],
  templateUrl: './stamp-card-section.html',
  styleUrl: './stamp-card-section.css'
})
export class StampCardSection {

  protected orderService = inject(OrderService);

  readonly earnedFreeDrinksCount$ = this.orderService.freeItemsByProduct$.pipe(
    map(m => Array.from(m.values()).reduce((sum, v) => sum + v, 0))
  );

  onStampClick(i: number): void {
    const current = this.orderService.stampCardStatusValue;
    this.orderService.setStampStatus(current === i ? i - 1 : i);
  }

}
