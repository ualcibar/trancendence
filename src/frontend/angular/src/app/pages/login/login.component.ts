import { Component} from '@angular/core';
import {AuthService, PrivateUserInfo, UserInfo} from '../../services/auth.service';
import { Router } from '@angular/router';
import { easeOut } from '../../../assets/animations/easeOut';
import { ip, id42 } from '../../../main';

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
  invalidForm: boolean = false;

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
    window.location.href = `https://api.intra.42.fr/oauth/authorize?client_id=${id42}&redirect_uri=https%3A%2F%2F${ip}%3A1501&response_type=code&state=login`;
  }

  async loginAcc() {
    this.error = false;
    this.formSent = true;
    try {
      await this.authService.login(this.user.username, this.user.password);

      this.formSent = false;
      window.location.href = "/";
    } catch (error: any) {
      this.error = true;
      this.invalidForm = false;
      console.error('❌ Ha ocurrido un error al intentar iniciar sesión');

      const errorMsg = error.error.message;
      if (errorMsg.includes("does not exist") || errorMsg.includes("doesn")) {
        this.userWrongCredentials = false;
        this.userDoesntExist = true;
      } else if (errorMsg.includes("account is not active")) {
        this.userInactive = true;
      } else if (errorMsg.includes("Invalid username or password")) {
        this.userDoesntExist = false;
        this.userWrongCredentials = true;
      } else if (errorMsg.includes("invalid form")) {
        this.invalidForm = true;
      }
      this.formSent = false;
      return;
    }
  }
}
