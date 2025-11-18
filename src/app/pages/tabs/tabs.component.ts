// src/app/pages/tabs/tabs.page.ts

import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  homeOutline, cashOutline, walletOutline, 
  pieChartOutline, barChartOutline, settingsOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel]
})
export class TabsPage {
  constructor() {
    addIcons({ 
      homeOutline, cashOutline, walletOutline, 
      pieChartOutline, barChartOutline, settingsOutline 
    });
  }
}