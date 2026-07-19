import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxAppVersionDirective } from 'ngx-app-version';
import { WindowTitlebar } from './core/window-titlebar/window-titlebar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WindowTitlebar],
  templateUrl: './app.html',
  styleUrl: './app.css',
  hostDirectives: [NgxAppVersionDirective],
})
export class App {}
