import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render both app download links', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('From idea');
    const downloadLinks = [
      compiled.querySelector('.header-cta'),
      compiled.querySelector('.hero-actions .button-dark'),
    ];

    for (const link of downloadLinks) {
      expect(link?.getAttribute('href')).toBe('FigmaDesktopApp.zip');
      expect(link?.getAttribute('download')).toBe('FigmaDesktopApp.zip');
    }
  });
});
