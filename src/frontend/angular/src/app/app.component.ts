import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'my-app';

  constructor(private translateService:TranslateService){
    this.translateService.setDefaultLang('en');
    this.translateService.use(localStorage.getItem('lang') || 'eus')
  }
}