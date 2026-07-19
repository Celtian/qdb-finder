import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { siteMetadata } from './site-metadata';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly site = siteMetadata;
  protected readonly links = [
    ['', 'Overview'],
    ['installation', 'Installation'],
    ['searching', 'Searching & filters'],
    ['players', 'Players'],
    ['teams-and-leagues', 'Teams & leagues'],
    ['referees-and-stadiums', 'Referees & stadiums'],
    ['supported-data', 'Supported FIFA data'],
    ['development', 'Development'],
    ['database', 'Database generation'],
    ['licensing', 'Licensing'],
    ['releases', 'Releases'],
  ] as const;
}
