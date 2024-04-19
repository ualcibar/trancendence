import { Component , OnInit} from '@angular/core';
import {AuthService, UserInfo} from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit{
  loggedIn : boolean = false;
  userId: number = -1;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.loggedIn = isLoggedIn;
    });

    this.authService.getUserId().then(userId => {
      this.userId = userId;
    });
  }
  logout(){
    console.log(`loggedin = ${this.loggedIn}`);
    this.authService.logout();
  }
}