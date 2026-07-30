import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfettiComponent } from './confetti.component';

interface ConfettiComponentInternals {
  animate(): void;
  particles: unknown[];
}

interface CanvasContextStub {
  arc: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  clearRect: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  fillStyle: string;
  globalAlpha: number;
  restore: ReturnType<typeof vi.fn>;
  rotate: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  setTransform: ReturnType<typeof vi.fn>;
  translate: ReturnType<typeof vi.fn>;
}

describe('ConfettiComponent', () => {
  let fixture: ComponentFixture<ConfettiComponent>;
  let component: ConfettiComponent;
  let context: CanvasContextStub;
  let prefersReducedMotion: boolean;

  beforeEach(async () => {
    prefersReducedMotion = false;
    vi.stubGlobal(
      'matchMedia',
      vi.fn(
        () =>
          ({
            matches: prefersReducedMotion,
          }) as MediaQueryList,
      ),
    );
    context = {
      arc: vi.fn(),
      beginPath: vi.fn(),
      clearRect: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
      globalAlpha: 1,
      restore: vi.fn(),
      rotate: vi.fn(),
      save: vi.fn(),
      setTransform: vi.fn(),
      translate: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((contextId: string) =>
      contextId === '2d'
        ? (context as unknown as CanvasRenderingContext2D)
        : null) as typeof HTMLCanvasElement.prototype.getContext);

    await TestBed.configureTestingModule({
      imports: [ConfettiComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ConfettiComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    if (!fixture.componentRef.hostView.destroyed) fixture.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('creates a decorative canvas and initializes its drawing context', () => {
    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;

    expect(canvas).toBeTruthy();
    expect(canvas.getAttribute('aria-hidden')).toBe('true');
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
    expect(context.setTransform).toHaveBeenCalled();
  });

  it('creates the requested particles and schedules one animation', () => {
    const requestAnimationFrame = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
    component.burst({ particleCount: 3 });
    component.burst({ particleCount: 2 });

    expect((component as unknown as ConfettiComponentInternals).particles).toHaveLength(5);
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
  });

  it('draws rectangle particles', () => {
    vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    component.burst({ colors: ['#fff'], particleCount: 1, ticks: 2 });

    (component as unknown as ConfettiComponentInternals).animate();

    expect(context.fillRect).toHaveBeenCalledOnce();
    expect(context.save).toHaveBeenCalledOnce();
    expect(context.restore).toHaveBeenCalledOnce();
  });

  it('draws circle particles', () => {
    vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    component.burst({ colors: ['#000'], particleCount: 1, ticks: 2 });

    (component as unknown as ConfettiComponentInternals).animate();

    expect(context.beginPath).toHaveBeenCalledOnce();
    expect(context.arc).toHaveBeenCalledOnce();
    expect(context.fill).toHaveBeenCalledOnce();
  });

  it('removes expired particles and stops animating', () => {
    const requestAnimationFrame = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
    component.burst({ particleCount: 2, ticks: 1 });
    requestAnimationFrame.mockClear();

    (component as unknown as ConfettiComponentInternals).animate();

    expect((component as unknown as ConfettiComponentInternals).particles).toHaveLength(0);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('clears particles and the canvas', () => {
    component.burst({ particleCount: 2 });

    component.clear();

    expect((component as unknown as ConfettiComponentInternals).particles).toHaveLength(0);
    expect(context.clearRect).toHaveBeenCalled();
  });

  it('cancels an active animation when destroyed', () => {
    vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(42);
    const cancelAnimationFrame = vi
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation(() => undefined);
    component.burst({ particleCount: 1 });

    fixture.destroy();

    expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
  });

  it('does not animate when reduced motion is preferred', () => {
    prefersReducedMotion = true;
    const requestAnimationFrame = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);

    component.burst();

    expect((component as unknown as ConfettiComponentInternals).particles).toHaveLength(0);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('does nothing without a canvas context', async () => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await TestBed.configureTestingModule({ imports: [ConfettiComponent] }).compileComponents();
    const noContextFixture = TestBed.createComponent(ConfettiComponent);
    await noContextFixture.whenStable();

    noContextFixture.componentInstance.burst();

    expect(
      (noContextFixture.componentInstance as unknown as ConfettiComponentInternals).particles,
    ).toHaveLength(0);
    noContextFixture.destroy();
  });
});

describe('ConfettiComponent on the server', () => {
  it('skips browser initialization and bursts', async () => {
    await TestBed.configureTestingModule({
      imports: [ConfettiComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ConfettiComponent);
    await fixture.whenStable();

    fixture.componentInstance.burst();

    expect(
      (fixture.componentInstance as unknown as ConfettiComponentInternals).particles,
    ).toHaveLength(0);
    fixture.destroy();
  });
});
