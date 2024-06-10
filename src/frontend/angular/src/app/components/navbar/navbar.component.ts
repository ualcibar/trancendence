import { Component , OnInit} from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  loading: boolean = true;

  lang:string ='';

  constructor(public authService: AuthService) {}

  ngOnInit() {
    this.authService.subscribe(() => {
      this.loading = false;
    });
  }

  logout(){
    this.authService.logout();
  }
}