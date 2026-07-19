import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navigation-menu',
  imports: [MatIconModule, MatMenuModule, RouterLink, RouterLinkActive],
  templateUrl: './app-navigation-menu.html',
  styleUrl: './app-navigation-menu.css',
})
export class AppNavigationMenu {}
