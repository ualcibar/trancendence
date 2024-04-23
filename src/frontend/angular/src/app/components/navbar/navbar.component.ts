import { Component , OnInit} from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  loggedIn : boolean = false;
  userId: number = -1;
  loading: boolean = true;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.updateUserInfo().subscribe({
      next: (userInfo: any) => {
        this.userId = userInfo.userid;
        this.loading = false;
      },
    });

    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.loggedIn = isLoggedIn;
    });
  }

  logout(){
    console.log(`loggedin = ${this.loggedIn}`);
    this.authService.logout();
  }
}