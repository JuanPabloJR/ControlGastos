import { TestBed } from '@angular/core/testing';

import { Ingresos } from './ingresos';

describe('Ingresos', () => {
  let service: Ingresos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ingresos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
