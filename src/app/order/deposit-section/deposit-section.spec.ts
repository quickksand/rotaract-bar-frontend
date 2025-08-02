import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DepositSection} from './deposit-section';

describe('DepositSection', () => {
  let component: DepositSection;
  let fixture: ComponentFixture<DepositSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepositSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepositSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
