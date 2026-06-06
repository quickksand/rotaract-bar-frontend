// preparation.component.ts
import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {AsyncPipe, CurrencyPipe} from '@angular/common';
import {Router} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {skip} from 'rxjs';
import {OrderService} from '../services/order.service';

@Component({
  selector: 'app-preparation',
  templateUrl: './preparation-component.html',
  imports: [
    CurrencyPipe,
    AsyncPipe
  ],
  styleUrls: ['./preparation-component.css']
})
export class PreparationComponent implements OnInit {

  protected orderService = inject(OrderService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  get activeOrders() {
    return this.orderService.activePreparationOrders$;
  }

  ngOnInit() {
    this.orderService.activePreparationOrders$.pipe(
      skip(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(orders => {
      if (orders.length === 0) {
        this.router.navigate(['/order']);
      }
    });
  }

  startOrder(orderId: number) {
    this.orderService.startPrepOrder(orderId);
  }

  startItem(orderId: number, itemIndex: number) {
    this.orderService.startPrepItem(orderId, itemIndex);
  }

  finishItem(orderId: number, itemIndex: number) {
    this.orderService.finishPrepItem(orderId, itemIndex);
  }

  finishOrder(orderId: number) {
    this.orderService.finishPrepOrder(orderId);
  }

  completeOrderDirectly(orderId: number) {
    this.orderService.finishPrepOrder(orderId);
  }
}
