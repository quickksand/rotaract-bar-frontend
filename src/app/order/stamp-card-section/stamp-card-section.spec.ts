import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StampCardSection } from './stamp-card-section';

describe('StampCardSection', () => {
  let component: StampCardSection;
  let fixture: ComponentFixture<StampCardSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StampCardSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StampCardSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
