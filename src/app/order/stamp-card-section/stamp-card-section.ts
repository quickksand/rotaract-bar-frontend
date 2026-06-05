import {Component, inject} from '@angular/core';
import {OrderService} from '../../services/order.service';
import {AsyncPipe} from '@angular/common';
import {map} from 'rxjs';

/**
 * WALLET-WORKAROUND (2026-06-03)
 *
 * Diese Komponente zeigt die Stempelkarte als 10er-Wallet-Ansicht,
 * obwohl die interne Logik weiterhin mit 4er-Zyklen arbeitet.
 *
 * Mapping: walletPosition % 5 = interne StampCard-Status (0–4).
 * Wallet-Positionen 5 und 10 sind Gratis-Positionen (⭐).
 *
 * Der walletPosition-State liegt im OrderService, damit er beim
 * Ein-/Ausklappen des mobilen Panels erhalten bleibt.
 *
 * Rückbau auf Papierkarten:
 * 1. Diese Datei auf den Stand vor dem Wallet-Workaround zurücksetzen
 *    (siehe Git-Historie, commit mit "WALLET-WORKAROUND")
 * 2. stamp-card-section.html ebenfalls zurücksetzen
 * 3. walletStampsToAdd$, walletPosition aus OrderService entfernen
 */
@Component({
  selector: 'app-stamp-card-section',
  imports: [
    AsyncPipe
  ],
  templateUrl: './stamp-card-section.html',
  styleUrl: './stamp-card-section.css'
})
export class StampCardSection {

  protected readonly orderService = inject(OrderService);

  /** Wallet-Positionen für die erste Reihe (1–5) und zweite Reihe (6–10) */
  protected readonly row1 = [1, 2, 3, 4, 5];
  protected readonly row2 = [6, 7, 8, 9, 10];
  /** Alle 10 Positionen in einer Zeile mit visueller Trennung im Template */
  protected readonly allPositions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  /** Positionen 5 und 10 sind Gratis-Slots (⭐) */
  isBonusPos(pos: number): boolean {
    return pos === 5 || pos === 10;
  }

  readonly earnedFreeDrinksCount$ = this.orderService.freeItemsByProduct$.pipe(
    map(m => Array.from(m.values()).reduce((sum, v) => sum + v, 0))
  );

  /** Wallet-Stempel die einzutragen sind (durchgereicht aus OrderService) */
  readonly walletStampsToAdd$ = this.orderService.walletStampsToAdd$;

  /** Getter für Template-Zugriff auf den zentralen walletPosition-State */
  get walletPosition(): number {
    return this.orderService.walletPosition;
  }

  /**
   * Klick auf eine Wallet-Position (1–10).
   * Toggle: erneuter Klick auf aktive Position setzt auf vorherige zurück.
   * Positionen 5 und 10 sind Gratis-Slots — sie setzen den internen Status auf 0
   * (= wie eine frische Runde, da der Gratisdrink bereits eingelöst wurde).
   */
  onWalletStampClick(pos: number): void {
    this.orderService.walletPosition = this.orderService.walletPosition === pos ? pos - 1 : pos;

    // Interne Logik: 4er-Zyklus-Status setzen
    this.orderService.setStampStatus(this.orderService.walletPosition % 5);
  }
}
