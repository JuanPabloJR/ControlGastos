import { TestBed } from '@angular/core/testing';

import { Presupuestos } from './presupuestos';

describe('Presupuestos', () => {
  let service: Presupuestos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Presupuestos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
