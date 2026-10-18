import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  inject
} from '@angular/core';

const THEME_STORAGE_KEY = 'imagin-theme';

@Component({
  selector: 'app-root',
  templateUrl: './app.html'
})
export class App implements AfterViewInit, OnDestroy, OnInit {
  isDarkTheme = false;

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  @ViewChildren('starGroup') private starGroups!: QueryList<ElementRef<HTMLDivElement>>;
  private starDriftTimeouts: number[] = [];

  ngOnInit(): void {
    const savedTheme = typeof window !== 'undefined' ? window.localStorage.getItem(THEME_STORAGE_KEY) : null;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

    this.isDarkTheme = savedTheme ? savedTheme === 'dark' : prefersDark;
    this.applyTheme();
  }

  ngAfterViewInit(): void {
    this.startStarDrift();
  }

  ngOnDestroy(): void {
    this.stopStarDrift();
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.applyTheme();
  }

  private applyTheme(): void {
    if (typeof document === 'undefined') {
      return;
    }

    this.host.classList.toggle('dark-theme', this.isDarkTheme);
    document.body.setAttribute('data-theme', this.isDarkTheme ? 'dark' : 'light');
    window.localStorage.setItem(THEME_STORAGE_KEY, this.isDarkTheme ? 'dark' : 'light');
  }

  private startStarDrift(): void {
    this.starGroups.forEach((group, index) => this.moveStarGroup(group, index));
  }

  private moveStarGroup(group: ElementRef<HTMLDivElement>, groupIndex: number): void {
    const position = this.findOpenStarPosition(groupIndex);
    if (!position) {
      this.starDriftTimeouts[groupIndex] = window.setTimeout(
        () => this.moveStarGroup(group, groupIndex),
        1500
      );
      return;
    }

    const stars = group.nativeElement;
    const previousX = Number.parseFloat(stars.style.getPropertyValue('--star-x'));
    const previousY = Number.parseFloat(stars.style.getPropertyValue('--star-y'));
    stars.style.setProperty('--star-x', `${position.x}px`);
    stars.style.setProperty('--star-y', `${position.y}px`);
    stars.classList.add('is-visible');
    this.starDriftTimeouts[groupIndex] = window.setTimeout(
      () => this.moveStarGroup(group, groupIndex),
      groupIndex === 0 ? 5200 + Math.random() * 1800 : 3800 + Math.random() * 1800
    );
  }

  private findOpenStarPosition(groupIndex: number): { x: number; y: number } | null {
    const margin = 46;
    const blockers = Array.from(document.querySelectorAll<HTMLElement>(
      'a, button, input, textarea, select, h1, h2, h3, p, strong, em, .hero-copy, .app-window, .floating-note, .art-sticker, .bottom-strip, .download-row, .site-header, .site-footer'
    )).map((element) => element.getBoundingClientRect());
    const currentGroup = this.starGroups.get(groupIndex)?.nativeElement;
    const startX = currentGroup?.classList.contains('is-visible')
      ? Number.parseFloat(currentGroup.style.getPropertyValue('--star-x'))
      : Number.NaN;
    const startY = currentGroup?.classList.contains('is-visible')
      ? Number.parseFloat(currentGroup.style.getPropertyValue('--star-y'))
      : Number.NaN;
    const otherGroups = this.starGroups
      .toArray()
      .filter((_, index) => index !== groupIndex)
      .map(({ nativeElement }) => ({
        visible: nativeElement.classList.contains('is-visible'),
        x: Number.parseFloat(nativeElement.style.getPropertyValue('--star-x')),
        y: Number.parseFloat(nativeElement.style.getPropertyValue('--star-y'))
      }))
      .filter((other) => other.visible && Number.isFinite(other.x) && Number.isFinite(other.y));

    for (let attempt = 0; attempt < 60; attempt += 1) {
      const x = margin + Math.random() * Math.max(0, window.innerWidth - margin * 2);
      const y = margin + Math.random() * Math.max(0, window.innerHeight - margin * 2);
      const overlapsAnotherGroup = otherGroups.some(
        (other) => Math.abs(x - other.x) < 100 && Math.abs(y - other.y) < 100
      );
      const pathSteps = Number.isFinite(startX) && Number.isFinite(startY)
        ? 12
        : 1;
      const pathIsClear = Array.from({ length: pathSteps }, (_, step) => {
        const progress = (step + 1) / pathSteps;
        const pointX = Number.isFinite(startX) ? startX + (x - startX) * progress : x;
        const pointY = Number.isFinite(startY) ? startY + (y - startY) * progress : y;
        return !blockers.some(
          (bounds) =>
            pointX + margin > bounds.left &&
            pointX - margin < bounds.right &&
            pointY + margin > bounds.top &&
            pointY - margin < bounds.bottom
        );
      }).every(Boolean);

      if (!overlapsAnotherGroup && pathIsClear) {
        return { x, y };
      }
    }

    return null;
  }

  private stopStarDrift(): void {
    this.starDriftTimeouts.forEach((timeout) => window.clearTimeout(timeout));
    this.starDriftTimeouts = [];
  }
}
