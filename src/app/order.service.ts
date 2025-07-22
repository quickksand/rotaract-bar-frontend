import {Injectable} from '@angular/core';
import {PurchaseOrderDto} from './api/api-client/dtos';
import {BehaviorSubject, map} from 'rxjs';

interface OrderedItem {
  productId: number,
  quantity: number
}

@Injectable({
  providedIn: "root"
})
export class OrderService {

  //alt Signals
  // private currentOrder = signal<OrderedItem[]>();

  //neu RxJS
  protected currentOrder$ = new BehaviorSubject<OrderedItem[]>([]);

  addToOrder(id: number) {
    const existingItem = this.currentOrder$.getValue().find(item => item.productId === id);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      this.currentOrder$.next([... this.currentOrder$.getValue(), { productId: id, quantity: 1 }]);
    }
  }

  removeFromOrder(id: number) {
    const item = this.currentOrder$.getValue().find(item => item.productId === id);
    if (item) {
      item.quantity--;
      if (item.quantity <= 0) {
        this.currentOrder$.next(this.currentOrder$.getValue().filter(item => item.productId !== id));
      }
    }
  }

  clearOrder() {
    this.currentOrder$.next([]);
  }

  getCurrentOrder() {
    return this.currentOrder$;
  }

  getQuantity(productId: number): number {
    return this.currentOrder$.getValue().find(item => item.productId === productId)?.quantity || 0;
  }

  getTotalPrice() {

    // hole withlatesfrom products um preise zu holen
    // allerdings aktualisieren sich die preise nur bei start der anwendung einmal, dann reicht es. first value from.
    return this.currentOrder$
      .pipe(
        map((orderedItems: OrderedItem[]) => console.log(orderedItems.map((item: OrderedItem) => item.productId)))
      );
  }

  convertToPurchaseOrderDto(): PurchaseOrderDto {
    return {
      items: this.currentOrder$.getValue()
    };
  }


}
