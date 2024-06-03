import { Component} from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

import { fadeInOut } from '../../../assets/animations/fadeInOut';

@Component({
  selector: 'app-login',
  animations: [fadeInOut],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  user = {
    username: '',
    password: ''
  };

  errorMessage: string = '';

  constructor(private http: HttpClient, private auth : AuthService, private router: Router) {}

  mostrarModal: boolean = false;

  login42Api() {
    window.location.href = 'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-8aae85ebafbe4fc02b48f3c831107662074a15fe99a907cac148d3e42db1cd87&redirect_uri=http%3A%2F%2Flocalhost%3A4200&response_type=code&state=login';
  }

  async loginAcc() {
    if (await this.auth.login(this.user.username, this.user.password)){
      this.router.navigate(['/']);
      //window.location.href="/";
    }else {
      this.errorMessage = 'Failed to login!';
    }
  }
}
