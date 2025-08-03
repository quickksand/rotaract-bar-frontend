import {TestBed} from '@angular/core/testing';

import {Ingredients} from './ingredients';

describe('Ingredients', () => {
  let service: Ingredients;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ingredients);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
