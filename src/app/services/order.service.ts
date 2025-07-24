import {inject, Injectable} from '@angular/core';
import {PurchaseOrderDto} from '../api/api-client/dtos';
import {BehaviorSubject, combineLatestWith, map, Observable} from 'rxjs';
import {ProductsService} from './products.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

interface OrderedItem {
  productId: number,
  quantity: number
}

@Injectable({
  providedIn: "root"
})
export class OrderService {

  private _currentOrder$ = new BehaviorSubject<OrderedItem[]>([]);
  private _currentOrderSum$ = new BehaviorSubject<number>(0);
  private _productService = inject(ProductsService);

  constructor() {
    // getCurrentOrderSum
    this._currentOrder$
      .pipe(
        combineLatestWith(this._productService.products$),
        map(([order, products]): number => {
          let sum = 0;
          order.forEach(item => {
            sum += (products.find(p => p.id === item.productId)?.price ?? 0) * item.quantity;
          })
          return sum;
        }),
        takeUntilDestroyed()
      ).subscribe((sum) => this._currentOrderSum$.next(sum))
  }

  get currentOrderSum$(): Observable<number> {
    // Public readonly Getter
    return this._currentOrderSum$.asObservable(); // oder asReadonly()
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
  }

  get currentOrder$() {
    return this._currentOrder$;
  }

  getQuantity(productId: number): number {
    return this._currentOrder$.getValue().find(item => item.productId === productId)?.quantity || 0;
  }

  convertToPurchaseOrderDto(): PurchaseOrderDto {
    return {
      items: this._currentOrder$.getValue()
    };
  }


}
