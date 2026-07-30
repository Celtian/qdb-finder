import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ConfettiComponent } from './confetti.component';
import { ConfettiService } from './confetti.service';

describe('ConfettiService', () => {
  let service: ConfettiService;
  let burst: ReturnType<typeof vi.fn>;
  let clear: ReturnType<typeof vi.fn>;
  let componentRef: ComponentRef<ConfettiComponent>;
  let overlayRef: {
    attach: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    hostElement: HTMLElement;
    overlayElement: HTMLElement;
  };
  let create: ReturnType<typeof vi.fn>;
  let top: ReturnType<typeof vi.fn>;
  let left: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    burst = vi.fn();
    clear = vi.fn();
    componentRef = {
      instance: { burst, clear } as unknown as ConfettiComponent,
    } as ComponentRef<ConfettiComponent>;
    overlayRef = {
      attach: vi.fn().mockReturnValue(componentRef),
      dispose: vi.fn(),
      hostElement: document.createElement('div'),
      overlayElement: document.createElement('div'),
    };
    left = vi.fn().mockReturnThis();
    top = vi.fn().mockReturnValue({ left });
    create = vi.fn().mockReturnValue(overlayRef as unknown as OverlayRef);

    TestBed.configureTestingModule({
      providers: [
        ConfettiService,
        {
          provide: Overlay,
          useValue: {
            create,
            position: () => ({ global: () => ({ top }) }),
            scrollStrategies: { noop: () => 'noop-strategy' },
          },
        },
      ],
    });
    service = TestBed.inject(ConfettiService);
  });

  it('creates one overlay and forwards burst options', () => {
    const options = { particleCount: 5 };

    service.burst(options);
    service.burst(options);

    expect(create).toHaveBeenCalledOnce();
    expect(overlayRef.attach).toHaveBeenCalledOnce();
    expect(burst).toHaveBeenCalledTimes(2);
    expect(burst).toHaveBeenCalledWith(options);
  });

  it('configures the full-screen overlay above other app overlays', () => {
    service.burst();

    expect(top).toHaveBeenCalledWith('0');
    expect(left).toHaveBeenCalledWith('0');
    expect(create).toHaveBeenCalledWith({
      hasBackdrop: false,
      panelClass: 'app-confetti-overlay-pane',
      positionStrategy: { left },
      scrollStrategy: 'noop-strategy',
      width: '100vw',
      height: '100vh',
    });
    expect(overlayRef.hostElement.style.zIndex).toBe('1000000000');
    expect(overlayRef.overlayElement.style.zIndex).toBe('1000000000');
    expect(overlayRef.overlayElement.style.pointerEvents).toBe('none');
  });

  it('performs the three celebration bursts with overrides', () => {
    const callbacks = new Map<number, VoidFunction>();
    const timeout = vi.spyOn(globalThis, 'setTimeout').mockImplementation((callback, delay) => {
      if (typeof callback === 'function') {
        callbacks.set(Number(delay), () => callback());
      }
      return 1 as unknown as ReturnType<typeof setTimeout>;
    });
    service.celebrate({ colors: ['gold'], particleCount: 10 });

    expect(burst).toHaveBeenNthCalledWith(1, {
      particleCount: 10,
      spread: 80,
      startVelocity: 28,
      colors: ['gold'],
    });

    callbacks.get(140)?.();
    expect(burst).toHaveBeenNthCalledWith(2, {
      particleCount: 10,
      origin: { x: 0.25, y: 0.45 },
      spread: 65,
      startVelocity: 22,
      colors: ['gold'],
    });

    callbacks.get(260)?.();
    expect(burst).toHaveBeenNthCalledWith(3, {
      particleCount: 10,
      origin: { x: 0.75, y: 0.45 },
      spread: 65,
      startVelocity: 22,
      colors: ['gold'],
    });
    timeout.mockRestore();
  });

  it('clears and disposes the active confetti overlay', () => {
    service.burst();

    service.clear();
    service.dispose();

    expect(clear).toHaveBeenCalledOnce();
    expect(overlayRef.dispose).toHaveBeenCalledOnce();
  });

  it('safely clears and disposes before an overlay exists', () => {
    expect(() => service.clear()).not.toThrow();
    expect(() => service.dispose()).not.toThrow();
  });

  it('recreates the overlay after disposal', () => {
    service.burst();
    service.dispose();
    service.burst();

    expect(create).toHaveBeenCalledTimes(2);
  });
});
