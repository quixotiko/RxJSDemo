import { TestBed } from '@angular/core/testing';

import { PainterService } from './painter.service';

describe('PainterService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PainterService = TestBed.get(PainterService);
    expect(service).toBeTruthy();
  });
});
