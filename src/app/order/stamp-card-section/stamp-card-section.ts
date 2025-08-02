import {Component, inject} from '@angular/core';
import {OrderService} from '../../services/order.service';
import {AsyncPipe} from '@angular/common';

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

}
