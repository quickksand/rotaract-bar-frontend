import {inject, Injectable} from '@angular/core';
import {PurchaseOrderDto} from '../api/api-client/dtos';
import {BehaviorSubject, combineLatest, combineLatestWith, map, Observable, skip} from 'rxjs';
import {ProductsService} from './products.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {PRICING} from '../constants/pricing.constants';
import {OrderedItem as OrderedItemDto} from '../api/generated-api/models/ordered-item';
import {IngredientsService} from './ingredients.service';

interface PrepOrder {
  id: number;
  orderNumber: string;
  status: 'OFFEN' | 'IN_ARBEIT' | 'FERTIG';
  timeAgo: string;
  createdAt: Date;
  total: number;
  items: PrepOrderItem[];
  originalOrder: PurchaseOrderDto;
}

interface PrepOrderItem {
  name: string;
  quantity: number;
  status: 'OFFEN' | 'IN_ARBEIT' | 'FERTIG';
  productId: number;
  ingredients?: string[];
}

@Injectable({
  providedIn: "root"
})
export class OrderService {

  //PFAND
  private _returnedCupsCount$ = new BehaviorSubject<number>(0);
  private _creditBalance$ = new BehaviorSubject<number>(0);

  //BESTELLUNG
  private _currentOrder$ = new BehaviorSubject<OrderedItemDto[]>([]);
  private _currentOrderSum$ = new BehaviorSubject<number>(0);
  private _currentDepositSum$ = new BehaviorSubject<number>(0);
  private _currentTotalSum$ = new BehaviorSubject<number>(0);

  //TRINKGELD
  private _tipAmount$ = new BehaviorSubject<number>(0);

  //STEMPELKARTE
  private _stampCardInputStatus$ = new BehaviorSubject<number>(0);
  private _stampCardStatusAfter$ = new BehaviorSubject<number>(0);
  private _nextDrinkFree$ = new BehaviorSubject<boolean>(false);
  private _freeDrinkDiscount$ = new BehaviorSubject<number>(0);
  private _freeItemsByProduct$ = new BehaviorSubject<Map<number, number>>(new Map());

  // PREPARATION
  private _preparationOrders$ = new BehaviorSubject<PrepOrder[]>([]);
  private _orderCounter = 1;

  private _productService = inject(ProductsService);
  private _ingredientsService = inject(IngredientsService)

  constructor() {
    //Summen-Berechnung
    this._currentOrder$
      .pipe(
        combineLatestWith(
          this._productService.products$,
          this._creditBalance$,
          this._stampCardInputStatus$
        ),
        map((
          [
            order,
            products,
            credit,
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
              drinksInOrder += item.quantity!;
            }
          });

          // Status nach Bestellung berechnen
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
              for (let i = 0; i < item.quantity!; i++) {
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
              itemSum += product.price * item.quantity!;

              if (product.category !== 'SHOTS') {
                depositSum += PRICING.DEPOSIT_AMOUNT * item.quantity!;
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

    // Trinkgeld zurücksetzen wenn sich etwas ändert, das den Gesamtbetrag beeinflusst
    this._currentOrder$.pipe(skip(1), takeUntilDestroyed())
      .subscribe(() => this._tipAmount$.next(0));
    this._returnedCupsCount$.pipe(skip(1), takeUntilDestroyed())
      .subscribe(() => this._tipAmount$.next(0));
    this._stampCardInputStatus$.pipe(skip(1), takeUntilDestroyed())
      .subscribe(() => this._tipAmount$.next(0));
  }

  get returnedCupsCount$(): Observable<number> {
    return this._returnedCupsCount$.asObservable();
  }

  get creditBalance$(): Observable<number> {
    return this._creditBalance$.asObservable();
  }

  readonly donateablePfandAmount$ = this._currentTotalSum$.pipe(
    map(total => Math.max(0, -total))
  );

  readonly newTokensNeeded$ = combineLatest([
    this._currentOrder$,
    this._productService.products$,
    this._returnedCupsCount$
  ]).pipe(
    map(([order, products, returnedCups]) => {
      let depositCupsCount = 0;
      order.forEach(item => {
        const product = products?.find(p => p.id === item.productId);
        if (product && product.category !== 'SHOTS') {
          depositCupsCount += item.quantity!;
        }
      });
      return Math.max(0, depositCupsCount - returnedCups);
    })
  );

  get donateablePfandAmountValue(): number {
    return Math.max(0, -this._currentTotalSum$.getValue());
  }

  get currentOrderSum$(): Observable<number> {
    return this._currentOrderSum$.asObservable();
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

  get tipAmount$(): Observable<number> {
    return this._tipAmount$.asObservable();
  }

  readonly orderTotalWithTip$ = combineLatest([this._currentTotalSum$, this._tipAmount$]).pipe(
    map(([total, tip]) => total + tip)
  );

  get orderTotalWithTipValue(): number {
    return this._currentTotalSum$.getValue() + this._tipAmount$.getValue();
  }

  get tipAmountValue(): number {
    return this._tipAmount$.getValue();
  }

  get creditBalanceValue(): number {
    return this._creditBalance$.getValue();
  }

  setTip(amount: number): void {
    this._tipAmount$.next(Math.round(amount * 100) / 100);
  }

  clearTip(): void {
    this._tipAmount$.next(0);
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
      const updatedOrder: OrderedItemDto[] = currentOrder.map(item =>
        item.productId === id
          ? {...item, quantity: item.quantity! += 1}
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
      if (existingItem!.quantity! <= 1) {
        this._currentOrder$.next(currentOrder.filter(item => item.productId !== id));
      } else {
        const updatedOrder: OrderedItemDto[] = currentOrder.map(item =>
          item.productId === id
            ? {... item, quantity: item.quantity!-1}
            : item
        )
        this._currentOrder$.next(updatedOrder)
      }
    }
  }

  setStampStatus(stamps: number) {
    this._stampCardInputStatus$.next(Math.max(0, Math.min(4, stamps)));
  }

  clearOrder() {
    this._currentOrder$.next([]);
    this._returnedCupsCount$.next(0);
    this._creditBalance$.next(0);
    this._stampCardInputStatus$.next(0);
    this._nextDrinkFree$.next(false);
    this._freeItemsByProduct$.next(new Map());
    // this._freeDrinkCount$.next(0);
    this._stampCardStatusAfter$.next(0);
    this._tipAmount$.next(0);
  }

  convertToPurchaseOrderDto(): PurchaseOrderDto {
    const tip = this._tipAmount$.getValue();
    return {
      items: this._currentOrder$.getValue(),
      returnedCupsCount: this._returnedCupsCount$.getValue(),
      ...(tip > 0 && { tipAmount: tip })
    };
  }

  // PREPARATION
  get preparationOrders$(): Observable<PrepOrder[]> {
    return this._preparationOrders$.asObservable();
  }
  get activePreparationOrders$(): Observable<PrepOrder[]> {
    return this._preparationOrders$.pipe(
      map(orders => orders.filter(order => order.status !== 'FERTIG'))
    );
  }

  // Nach BEZAHLEN aufrufen
  submitOrderToPreparation(): void {
    const orderDto = this.convertToPurchaseOrderDto();

    if (!orderDto.items || orderDto.items.length === 0) {
      console.warn('Keine Items in der Bestellung - Preparation übersprungen');
      this.clearOrder();
      return;
    }

    const prepOrder: PrepOrder = {
      id: Date.now(),
      orderNumber: `#${this._orderCounter++}`,
      status: 'OFFEN',
      timeAgo: 'gerade eben',
      createdAt: new Date(),
      total: this.orderTotalWithTipValue,
      items: this.convertToOrderItems(orderDto.items),
      originalOrder: orderDto
    };

    const currentOrders = this._preparationOrders$.getValue();
    this._preparationOrders$.next([...currentOrders, prepOrder]);

    // Bestellung zurücksetzen
    this.clearOrder();
  }

  private convertToOrderItems(items: OrderedItemDto[] | undefined): PrepOrderItem[] {
    if (!items) return [];

    return items
      .filter(item => item.productId !== undefined && item.quantity !== undefined)
      .map(item => {
        const product = this._productService.getProductById(item.productId!);
        return {
          name: `${item.quantity!}x ${product?.name || 'Unbekannt'}`,
          quantity: item.quantity!,
          status: 'OFFEN' as const,
          productId: item.productId!,
          ingredients: this.getIngredients(item.productId!)
        };
      });
  }

  private getIngredients(productId: number): string[] {
    const product = this._productService.getProductById(productId);

    console.log(product)

    if (product?.ingredientIds) {
        return this._ingredientsService.getIngredientsByIds(product.ingredientIds)
          .map(ingredient => ingredient.name || 'Unbekannt');
    }

    return [];
  }

  // Preparation Methods
  startPrepOrder(orderId: number): void {
    this.updateOrderStatus(orderId, 'IN_ARBEIT');
  }

  startPrepItem(orderId: number, itemIndex: number): void {
    const orders = this._preparationOrders$.getValue();
    const order = orders.find(o => o.id === orderId);
    if (order?.items[itemIndex]) {
      order.items[itemIndex].status = 'IN_ARBEIT';
      if (order.status === 'OFFEN') {
        order.status = 'IN_ARBEIT';
      }
      this._preparationOrders$.next([...orders]);
    }
  }

  finishPrepItem(orderId: number, itemIndex: number): void {
    const orders = this._preparationOrders$.getValue();
    const order = orders.find(o => o.id === orderId);
    if (order?.items[itemIndex]) {
      order.items[itemIndex].status = 'FERTIG';

      // Prüfen ob alle Items fertig
      const allItemsFinished = order.items.every(item => item.status === 'FERTIG');
      if (allItemsFinished) {
        order.status = 'FERTIG';
      }
      this._preparationOrders$.next([...orders]);
    }
  }

  finishPrepOrder(orderId: number): void {
    const orders = this._preparationOrders$.getValue();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'FERTIG';
      order.items.forEach(item => item.status = 'FERTIG');
      this._preparationOrders$.next([...orders]);
    }
  }

  private updateOrderStatus(orderId: number, status: 'OFFEN' | 'IN_ARBEIT' | 'FERTIG'): void {
    const orders = this._preparationOrders$.getValue();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      this._preparationOrders$.next([...orders]);
    }
  }

  // Getter für currentTotalValue
  get currentTotalValue(): number {
    return this._currentTotalSum$.getValue();
  }

}
