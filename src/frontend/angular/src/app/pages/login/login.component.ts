import { Component} from '@angular/core';
import {AuthService, PrivateUserInfo, UserInfo} from '../../services/auth.service';
import { Router } from '@angular/router';
import { easeOut } from '../../../assets/animations/easeOut';

@Component({
  selector: 'app-login',
  animations: [easeOut],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  info? : UserInfo | undefined;

  user = {
    username: '',
    password: ''
  };

  formSent: boolean = false;

  error: boolean = false;

  userDoesntExist: boolean = false;
  userInactive: boolean = false;
  userWrongCredentials: boolean = false;

  constructor(private authService : AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.subscribe({
      next: (userInfo : PrivateUserInfo) => {
        if (userInfo) {
          this.router.navigate(['/']);
        }
      }
    })
  }

  login42Api() {
    window.location.href = 'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-8aae85ebafbe4fc02b48f3c831107662074a15fe99a907cac148d3e42db1cd87&redirect_uri=http%3A%2F%2Flocalhost%3A4200&response_type=code&state=login';
  }

  async loginAcc() {
    this.error = false;
    this.formSent = true;
    try {
      await this.authService.login(this.user.username, this.user.password);

      this.formSent = false;
      this.router.navigate(['/']);
      //window.location.href = "/"; //Hay que mirar esto; si por ejemplo el usuario tiene el idioma "Inglés" puesto, al iniciar sesión, no lo cambia al inglés.
    } catch (error: any) {
      console.error('❌ Ha ocurrido un error al intentar iniciar sesión');

      const errorMsg = error.error.message;
      if (errorMsg.includes("does not exist")) {
        this.userWrongCredentials = false;
        this.userDoesntExist = true;
      } else if (errorMsg.includes("account is not active")) {
        this.userInactive = true;
      } else if (errorMsg.includes("Invalid username or password")) {
        this.userDoesntExist = false;
        this.userWrongCredentials = true;
      }
      this.error = true;
      this.formSent = false;
      return;
    }
  }
}
