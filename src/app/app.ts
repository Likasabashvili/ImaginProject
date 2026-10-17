import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html'
})
export class App implements AfterViewInit, OnDestroy, OnInit {
  @HostBinding('class.dark-theme') isDarkTheme = false;
  @ViewChildren('starGroup') private starGroups!: QueryList<ElementRef<HTMLDivElement>>;
  private starDriftTimeouts: number[] = [];

  ngOnInit(): void {
    const savedTheme = typeof window !== 'undefined' ? window.localStorage.getItem('imagin-theme') : null;
    const prefersDark =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    this.isDarkTheme = savedTheme ? savedTheme === 'dark' : prefersDark;
    this.syncTheme();
  }

  ngAfterViewInit(): void {
    this.startStarDrift();
  }

  ngOnDestroy(): void {
    this.stopStarDrift();
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.syncTheme();
  }

  private startStarDrift(): void {
    this.starGroups.forEach((group, index) => this.showStarsAtRandomPosition(group, index));
  }

  private showStarsAtRandomPosition(group: ElementRef<HTMLDivElement>, index: number): void {
    const position = this.findOpenStarPosition(index);
    if (!position) {
      this.starDriftTimeouts[index] = window.setTimeout(
        () => this.showStarsAtRandomPosition(group, index),
        1500
      );
      return;
    }

    group.nativeElement.style.setProperty('--star-x', `${position.x}px`);
    group.nativeElement.style.setProperty('--star-y', `${position.y}px`);
    group.nativeElement.classList.add('is-visible');
    this.starDriftTimeouts[index] = window.setTimeout(
      () => this.showStarsAtRandomPosition(group, index),
      index === 0 ? 5200 + Math.random() * 1800 : 3800 + Math.random() * 1800
    );
  }

  private findOpenStarPosition(groupIndex: number): { x: number; y: number } | null {
    const margin = 46;
    const blockers = document.querySelectorAll<HTMLElement>(
      'a, button, input, textarea, select, h1, h2, h3, p, strong, em, .app-window, .floating-note, .art-sticker, .bottom-strip, .download-row, .site-header, .site-footer'
    );
    const otherGroups = this.starGroups
      .toArray()
      .filter((_, index) => index !== groupIndex)
      .map(({ nativeElement }) => ({
        visible: nativeElement.classList.contains('is-visible'),
        x: Number.parseFloat(nativeElement.style.getPropertyValue('--star-x')),
        y: Number.parseFloat(nativeElement.style.getPropertyValue('--star-y'))
      }))
      .filter((group) => group.visible && Number.isFinite(group.x) && Number.isFinite(group.y));

    for (let attempt = 0; attempt < 60; attempt += 1) {
      const x = margin + Math.random() * Math.max(0, window.innerWidth - margin * 2);
      const y = margin + Math.random() * Math.max(0, window.innerHeight - margin * 2);
      const overlapsAnotherGroup = otherGroups.some(
        (group) => Math.abs(x - group.x) < 100 && Math.abs(y - group.y) < 100
      );
      const overlapsContent = Array.from(blockers).some((element) => {
        const bounds = element.getBoundingClientRect();
        return (
          x + margin > bounds.left &&
          x - margin < bounds.right &&
          y + margin > bounds.top &&
          y - margin < bounds.bottom
        );
      });

      if (!overlapsContent && !overlapsAnotherGroup) {
        return { x, y };
      }
    }

    return null;
  }

  private stopStarDrift(): void {
    this.starDriftTimeouts.forEach((timeout) => window.clearTimeout(timeout));
    this.starDriftTimeouts = [];
  }

  private syncTheme(): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.setAttribute('data-theme', this.isDarkTheme ? 'dark' : 'light');
    window.localStorage.setItem('imagin-theme', this.isDarkTheme ? 'dark' : 'light');
  }
}
