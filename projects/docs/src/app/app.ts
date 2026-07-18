import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly links = [
    ['', 'Overview'],
    ['installation', 'Installation'],
    ['searching', 'Searching & filters'],
    ['supported-data', 'Supported FIFA data'],
    ['development', 'Development'],
    ['database', 'Database generation'],
    ['licensing', 'Licensing'],
    ['releases', 'Releases'],
  ] as const;
}
