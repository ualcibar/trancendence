import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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

  constructor(private http: HttpClient) {}

<<<<<<< HEAD
  mostrarModal: boolean = false;
  imLoggedIn() {
    const backendURL = 'http://localhost:8000/polls/imLoggedIn/';
    this.http.get<any>(backendURL).subscribe(
      response => {
        console.log('Sent data: ', response);
      },
      error => {
        console.error('An error ocurred trying to contact the registration server: ', error);
      }
    );
  }

  mostrarToast() {
    this.mostrarModal = true;
    console.log("lol");
  }

  cerrarModal() {
    this.mostrarModal = false;
=======
  logout(): void {
    const backendURL = 'http://localhost:8000/polls/logout';
>>>>>>> 45adbbb5ade58cef1231c6b7819fa96674a7b95f
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
      })
    };

    this.http.post<any>(backendURL, jsonToSend, httpOptions).subscribe(
      response => {
        console.log('Sent data: ', response);
        console.log('Response: ', response.sessionid);
        this.successMessage = response.message;
      },
      error => {
        console.error('An error ocurred trying to contact the registration server: ', error);
        this.errorMessage = 'An error occurred: ' + error.message;
      }
    );
  }
}
