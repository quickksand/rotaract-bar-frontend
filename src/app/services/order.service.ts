import {inject, Injectable} from '@angular/core';
import {PurchaseOrderDto} from '../api/api-client/dtos';
import {BehaviorSubject, combineLatestWith, map, Observable} from 'rxjs';
import {ProductsService} from './products.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {PRICING} from '../constants/pricing.constants';

interface OrderedItem {
  productId: number,
  quantity: number
}

@Injectable({
  providedIn: "root"
})
export class OrderService {

  private _returnedCupsCount$ = new BehaviorSubject<number>(0);
  private _creditBalance$ = new BehaviorSubject<number>(0);

  private _currentOrder$ = new BehaviorSubject<OrderedItem[]>([]);
  private _currentOrderSum$ = new BehaviorSubject<number>(0);
  private _currentDepositSum$ = new BehaviorSubject<number>(0);
  private _currentTotalSum$ = new BehaviorSubject<number>(0);

  private _productService = inject(ProductsService);

  constructor() {
    //Summen-Berechnung
    this._currentOrder$
      .pipe(
        combineLatestWith(this._productService.products$, this._creditBalance$),
        map(([order, products, credit]) => {
          let itemSum = 0;
          let depositSum = 0;

          order.forEach(item => {
            const product = products!.find(p => p.id === item.productId);
            if (product) {
              itemSum += product.price * item.quantity;
              if (product.category !== 'SHOTS') {
                depositSum += PRICING.DEPOSIT_AMOUNT * item.quantity;
              }
            }
          });

          // Guthaben automatisch verrechnen
          const totalBeforeCredit = itemSum + depositSum;
          const totalSum = totalBeforeCredit - credit;

          return { itemSum, depositSum, totalSum, totalBeforeCredit };
        }),
        takeUntilDestroyed()
      ).subscribe(({itemSum, depositSum, totalSum}) => {
      this._currentOrderSum$.next(itemSum);
      this._currentDepositSum$.next(depositSum);
      this._currentTotalSum$.next(totalSum);
    });
  }

  get returnedCupsCount$(): Observable<number> {
    return this._returnedCupsCount$.asObservable();
  }

  // Neue Getter:
  get creditBalance$(): Observable<number> {
    return this._creditBalance$.asObservable();
  }

  get creditBalanceValue(): number {
    return this._creditBalance$.getValue();
  }

  get currentOrderSum$(): Observable<number> {
    // Public readonly Getter
    return this._currentOrderSum$.asObservable(); // oder asReadonly()
  }

  get currentDepositSum$(): Observable<number> {
    return this._currentDepositSum$.asObservable();
  }

  get currentTotalSum$(): Observable<number> {
    return this._currentTotalSum$.asObservable();
  }

// Optional: Synchrone Getter für aktuelle Werte
  get currentDepositValue(): number {
    return this._currentDepositSum$.getValue();
  }

  get currentTotalValue(): number {
    return this._currentTotalSum$.getValue();
  }

  get currentOrder$() {
    return this._currentOrder$;
  }

  returnCup() {
    const currentCount = this._returnedCupsCount$.getValue();
    const currentCredit = this._creditBalance$.getValue();

    this._returnedCupsCount$.next(currentCount + 1);
    this._creditBalance$.next(currentCredit + PRICING.DEPOSIT_AMOUNT);
  }

  removeCup() {
    const currentCount = this._returnedCupsCount$.getValue();
    const currentCredit = this._creditBalance$.getValue();

    if (currentCount > 0) {
      this._returnedCupsCount$.next(currentCount - 1);
      this._creditBalance$.next(currentCredit - PRICING.DEPOSIT_AMOUNT);
    }
  }

  applyCreditToOrder() {
    // Logik für später, wenn du das Guthaben verrechnen willst
  }

  addToOrder(id: number) {
    const currentOrder = this._currentOrder$.getValue();
    const existingItem = currentOrder.find(item => item.productId === id);
    if (existingItem) {
      const updatedOrder: OrderedItem[] = currentOrder.map(item =>
        item.productId === id
        ? {...item, quantity: item.quantity += 1}
        : item
      )
      this._currentOrder$.next(updatedOrder);

    } else {
      this._currentOrder$.next([... this._currentOrder$.getValue(), { productId: id, quantity: 1 }]);
    }
  }

  removeFromOrder(id: number) {
    const currentOrder = this._currentOrder$.getValue();
    const existingItem = currentOrder.find(item => item.productId === id);

    if (existingItem) {
      if (existingItem.quantity <= 1) {
        this._currentOrder$.next(currentOrder.filter(item => item.productId !== id));
      } else {
        const updatedOrder: OrderedItem[] = currentOrder.map(item =>
          item.productId === id
          ? {... item, quantity: item.quantity-1}
          : item
        )
        this._currentOrder$.next(updatedOrder)
      }
    }
  }

  clearOrder() {
    this._currentOrder$.next([]);
    this._returnedCupsCount$.next(0);
    this._creditBalance$.next(0);
  }

  getQuantity(productId: number): number {
    return this._currentOrder$.getValue().find(item => item.productId === productId)?.quantity || 0;
  }

  convertToPurchaseOrderDto(): PurchaseOrderDto {
    return {
      items: this._currentOrder$.getValue(),
      returnedCupsCount: this._returnedCupsCount$.getValue()
    };
  }


}
