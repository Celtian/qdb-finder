import { TestBed } from '@angular/core/testing';

import { Qdb } from './qdb';

describe('Qdb', () => {
  let service: Qdb;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Qdb);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
