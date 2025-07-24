import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ProductCategorySectionComponent} from './product-category-section.component';

describe('ProductCategorySectionComponent', () => {
  let component: ProductCategorySectionComponent;
  let fixture: ComponentFixture<ProductCategorySectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCategorySectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductCategorySectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
