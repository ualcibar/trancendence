import { Component , OnInit} from '@angular/core';
import { AuthService, UserInfo } from '../../services/auth.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  loading: boolean = true;

  lang:string ='';

  constructor(public authService: AuthService, private translateService:TranslateService) {}



  ngOnInit() {
    this.authService.isLoggedIn$.subscribe(() => {
      this.loading = false;
    });
    this.lang = localStorage.getItem('lang') || 'eus';
  }

  ChangeLang(lang:any){
    const selectedLanguage = lang.target.value;

    localStorage.setItem('lang',selectedLanguage);

    this.translateService.use(selectedLanguage);

  }
  logout(){
    this.authService.logout();
  }
}