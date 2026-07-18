import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WindowTitlebar } from './core/window-titlebar/window-titlebar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WindowTitlebar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
