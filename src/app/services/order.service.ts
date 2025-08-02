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

  //PFAND
  private _returnedCupsCount$ = new BehaviorSubject<number>(0);
  private _creditBalance$ = new BehaviorSubject<number>(0);

  //BESTELLUNG
  private _currentOrder$ = new BehaviorSubject<OrderedItem[]>([]);
  private _currentOrderSum$ = new BehaviorSubject<number>(0);
  private _currentDepositSum$ = new BehaviorSubject<number>(0);
  private _currentTotalSum$ = new BehaviorSubject<number>(0);

  //STEMPELKARTE
  private _stampCardInputStatus$ = new BehaviorSubject<number>(0);
  private _stampCardStatusAfter$ = new BehaviorSubject<number>(0);
  private _nextDrinkFree$ = new BehaviorSubject<boolean>(false);
  private _freeDrinkDiscount$ = new BehaviorSubject<number>(0);
  private _freeItemsByProduct$ = new BehaviorSubject<Map<number, number>>(new Map());


  private _productService = inject(ProductsService);

  constructor() {
    //Summen-Berechnung
    this._currentOrder$
      .pipe(
        combineLatestWith(
          this._productService.products$,
          this._creditBalance$,
          // this._freeDrinkCount$,
          this._stampCardInputStatus$
        ),
        map((
          [
            order,
            products,
            credit,
            // freeDrinkCount,
            inputStatus
          ]) => {

          let itemSum = 0;
          let depositSum = 0;
          let freeDrinkDiscount = 0;

          // Drinks in aktueller Bestellung zählen
          let drinksInOrder = 0;
          order.forEach(item => {
            const product = products?.find(p => p.id === item.productId);
            if (product?.category === 'DRINKS') {
              drinksInOrder += item.quantity;
            }
          });

          // Status nach Bestellung berechnen
          // const inputStatus = this._stampCardInputStatus$.getValue();
          let statusAfter = inputStatus + drinksInOrder;
          let earnedFreedrinks = 0;

          // Für jeden 4er-Block → 1 Free Drink verdient
          while (statusAfter >= 4) {
            earnedFreedrinks++;
            statusAfter -= 4;
          }

          // Alle DRINKS sammeln und nach Preis sortieren
          const drinkItems: {price: number, product: any}[] = [];
          order.forEach(item => {
            const product = products?.find(p => p.id === item.productId);
            if (product?.category === 'DRINKS') {
              for (let i = 0; i < item.quantity; i++) {
                drinkItems.push({price: product.price, product});
              }
            }
          });

          // Nach Preis absteigend sortieren
          drinkItems.sort((a, b) => b.price - a.price);

          // Free Items pro Produkt berechnen
          const freeItemsMap = new Map<number, number>();

          // X teuerste Drinks als gratis markieren
          for (let i = 0; i < Math.min(earnedFreedrinks, drinkItems.length); i++) {
            freeDrinkDiscount += drinkItems[i].price;
            const productId = drinkItems[i].product.id;
            freeItemsMap.set(productId, (freeItemsMap.get(productId) || 0) + 1);
          }

          // Normale Summenberechnung
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
          const totalBeforeCredit = itemSum + depositSum - freeDrinkDiscount;
          const totalSum = totalBeforeCredit - credit;

          return {
            itemSum,
            depositSum,
            totalSum,
            freeDrinkDiscount,
            freeItemsMap,
            stampCardStatusAfter: statusAfter,
            nextDrinkFree: statusAfter === 4
          };
        }),
        takeUntilDestroyed()
      ).subscribe(({itemSum, depositSum, totalSum, freeDrinkDiscount, freeItemsMap, stampCardStatusAfter, nextDrinkFree}) => {
      this._currentOrderSum$.next(itemSum);
      this._currentDepositSum$.next(depositSum);
      this._currentTotalSum$.next(totalSum);
      this._freeDrinkDiscount$.next(freeDrinkDiscount);
      this._freeItemsByProduct$.next(freeItemsMap);
      this._stampCardStatusAfter$.next(stampCardStatusAfter);
      this._nextDrinkFree$.next(nextDrinkFree);
    });
  }

  get returnedCupsCount$(): Observable<number> {
    return this._returnedCupsCount$.asObservable();
  }

  get creditBalance$(): Observable<number> {
    return this._creditBalance$.asObservable();
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

  get currentOrder$() {
    return this._currentOrder$;
  }

  get stampCardStatus$(): Observable<number> {
    return this._stampCardInputStatus$.asObservable();
  }

  get freeDrinkDiscount$(): Observable<number> {
    return this._freeDrinkDiscount$.asObservable();
  }

  get freeItemsByProduct$(): Observable<Map<number, number>> {
    return this._freeItemsByProduct$.asObservable();
  }

  get stampCardStatusAfter$(): Observable<number> {
    return this._stampCardStatusAfter$.asObservable();
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

  setStampStatus(stamps: number) {
    this._stampCardInputStatus$.next(Math.max(0, Math.min(4, stamps)));
  }

  // private updateStampCard(change: number) {
  //   const currentStamps = this._stampCardStatus$.getValue();
  //   let newStamps = currentStamps + change;
  //   let earnedFreedrinks = 0;
  //
  //   // Für jeden 4er-Block → 1 Free Drink verdient
  //   while (newStamps >= 4) {
  //     earnedFreedrinks++;
  //     newStamps -= 4;
  //   }
  //
  //   if (earnedFreedrinks > 0) {
  //     const currentFreeCount = this._freeDrinkCount$.getValue();
  //     this._freeDrinkCount$.next(currentFreeCount + earnedFreedrinks);
  //   }
  //
  //   newStamps = Math.max(0, newStamps);
  //   this._stampCardStatus$.next(newStamps);
  //   this._nextDrinkFree$.next(newStamps === 4);
  // }

  clearOrder() {
    this._currentOrder$.next([]);
    this._returnedCupsCount$.next(0);
    this._creditBalance$.next(0);
    this._stampCardInputStatus$.next(0);
    this._nextDrinkFree$.next(false);
    this._freeItemsByProduct$.next(new Map());
    // this._freeDrinkCount$.next(0);
    this._stampCardStatusAfter$.next(0);
  }

  convertToPurchaseOrderDto(): PurchaseOrderDto {
    return {
      items: this._currentOrder$.getValue(),
      returnedCupsCount: this._returnedCupsCount$.getValue()
    };
  }


}
