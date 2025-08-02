import {Component, inject} from '@angular/core';
import {MatCard, MatCardHeader, MatCardSubtitle, MatCardTitle} from "@angular/material/card";
import {OrderService} from '../../services/order.service';
import {AsyncPipe, CurrencyPipe} from '@angular/common';

@Component({
  selector: 'app-deposit-section',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardSubtitle,
    MatCardTitle,
    AsyncPipe,
    CurrencyPipe
  ],
  templateUrl: './deposit-section.html',
  styleUrl: './deposit-section.css'
})
export class DepositSection {

  protected orderService = inject(OrderService);

  returnCup() {
    this.orderService.returnCup();
  }

}
