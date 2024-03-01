import { Component} from '@angular/core';
import { Router} from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  user = {
    username: '',
    password: ''
  };

  errorMessage: string = '';
  successMessage: string = '';

  constructor(private http: HttpClient, private auth : AuthService, private router: Router) {}

  mostrarModal: boolean = false;

  login42Api() {
    window.location.href = 'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-8aae85ebafbe4fc02b48f3c831107662074a15fe99a907cac148d3e42db1cd87&redirect_uri=http%3A%2F%2Flocalhost%3A4200&response_type=code&state=login';
  }


  imLoggedIn() {
    const backendURL = 'http://localhost:8000/polls/imLoggedIn';
    this.http.get<any>(backendURL, {withCredentials: true}).subscribe(
      response => {
        console.log('Sent data: ', response);
      },
      error => {
        console.error('An error ocurred trying to contact the registration server: ', error);
      }
    );
  }

  loginAcc() {
    const backendURL = 'http://localhost:8000/polls/login/';
    const jsonToSend = {
      username: this.user.username,
      password: this.user.password
    };

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type' : 'application/json'
      }),
      withCredentials: true
    };

    this.http.post<any>(backendURL, jsonToSend, httpOptions).subscribe(
      response => {
        console.log('Sent data: ', response);
        console.log('Response: ', response.sessionid);
        this.successMessage = response.message;
        this.auth.login();
        this.router.navigate(['/']);
      },
      error => {
        console.error('An error ocurred trying to contact the registration server: ', error);
        this.errorMessage = 'An error occurred: ' + error.message;
      }
    );
  }
}
