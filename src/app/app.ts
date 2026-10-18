import { ChangeDetectorRef, Component, ElementRef, OnInit, inject } from '@angular/core';

const THEME_STORAGE_KEY = 'imagin-theme';
const THEME_FADE_CLASS = 'theme-fade';
const THEME_FADE_MS = 500;
const THEME_REVEAL_MS = 650;

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> };
};

@Component({
  selector: 'app-root',
  templateUrl: './app.html'
})
export class App implements OnInit {
  isDarkTheme = false;

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly cdr = inject(ChangeDetectorRef);
  private fadeTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    const savedTheme = typeof window !== 'undefined' ? window.localStorage.getItem(THEME_STORAGE_KEY) : null;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

    this.isDarkTheme = savedTheme ? savedTheme === 'dark' : prefersDark;
    this.applyTheme();
  }

  toggleTheme(event?: MouseEvent): void {
    const nextIsDark = !this.isDarkTheme;
    const { x, y } = this.originOf(event);

    const update = () => {
      this.isDarkTheme = nextIsDark;
      // Flush bindings inside the transition callback so the new state is captured in the same frame.
      this.cdr.detectChanges();
      this.applyTheme();
    };

    if (this.prefersReducedMotion()) {
      update();
      return;
    }

    const doc = document as ViewTransitionDocument;

    if (doc.startViewTransition) {
      const transition = doc.startViewTransition(update);
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`]
            },
            {
              duration: THEME_REVEAL_MS,
              easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
              pseudoElement: '::view-transition-new(root)'
            }
          );
        })
        .catch(() => {
          // The transition was skipped; the theme is already applied.
        });
      return;
    }

    this.fadeTheme(update);
  }

  private applyTheme(): void {
    if (typeof document === 'undefined') {
      return;
    }

    this.host.classList.toggle('dark-theme', this.isDarkTheme);
    document.body.setAttribute('data-theme', this.isDarkTheme ? 'dark' : 'light');
    window.localStorage.setItem(THEME_STORAGE_KEY, this.isDarkTheme ? 'dark' : 'light');
  }

  /** Fallback for browsers without View Transitions: transition colors across the page for a short window. */
  private fadeTheme(update: () => void): void {
    const root = document.documentElement;

    root.classList.add(THEME_FADE_CLASS);
    update();

    clearTimeout(this.fadeTimer);
    this.fadeTimer = setTimeout(() => root.classList.remove(THEME_FADE_CLASS), THEME_FADE_MS);
  }

  private originOf(event?: MouseEvent): { x: number; y: number } {
    const target = event?.currentTarget as HTMLElement | null | undefined;

    if (target?.getBoundingClientRect) {
      const rect = target.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
