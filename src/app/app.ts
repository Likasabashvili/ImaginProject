import { Component, HostBinding, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html'
})
export class App implements OnInit {
  @HostBinding('class.dark-theme') isDarkTheme = false;

  ngOnInit(): void {
    const savedTheme = typeof window !== 'undefined' ? window.localStorage.getItem('imagin-theme') : null;
    const prefersDark =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    this.isDarkTheme = savedTheme ? savedTheme === 'dark' : prefersDark;
    this.syncTheme();
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.syncTheme();
  }

  private syncTheme(): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.setAttribute('data-theme', this.isDarkTheme ? 'dark' : 'light');
    window.localStorage.setItem('imagin-theme', this.isDarkTheme ? 'dark' : 'light');
  }
}
