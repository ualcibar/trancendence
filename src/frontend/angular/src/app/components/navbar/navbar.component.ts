import { Component , OnInit} from '@angular/core';
import { AuthService, UserInfo } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  loading: boolean = true;

  constructor(public authService: AuthService) {}

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe(() => {
      this.loading = false;
    });
  }

  logout(){
    this.authService.logout();
  }
}