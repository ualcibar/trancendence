import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { Router} from '@angular/router';
import { ChatComponent } from '../../components/chat/chat.component';

import {LobbySearchComponent} from '../../components/lobby-search/lobby-search.component';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ChatComponent, LobbySearchComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})

export class HomeComponent implements OnInit{
    constructor(private route: ActivatedRoute, private http: HttpClient, private auth: AuthService,  private router: Router) { }
    ngOnInit(): void {
        // Your initialization code here
        this.route.queryParams.subscribe(params => {
            const code = params['code']; // Extract authorization code from query parameters
            // Now you can use the authorization code to obtain an access token
            const state = params['state'];
            if (code && state) {
                // Handle the authorization code
                
                const jsonToSend = {
                    code: code
                };
                
                console.log('Authorization code:', code);
                if (state == 'login') {
                    const httpOptions = {
                        headers: new HttpHeaders({
                            'Content-Type': 'application/json'
                        }),
                        withCredentials: true
                    };
                    const backendURL = 'http://localhost:8000/polls/login42/';

                    this.http.post<any>(backendURL, jsonToSend, httpOptions).subscribe(
                        response => {
                            this.auth.login();
                            this.router.navigate(['/']);
                            console.log('Sent data: ', response);
                        },
                        error => {
                            console.error('Failed to login using 42: ', error);
                        }
                    );
                }else if (state == 'register'){
                    const httpOptions = {
                        headers: new HttpHeaders({
                            'Content-Type': 'application/json'
                        })
                    };
                    const backendURL = 'http://localhost:8000/polls/register42/';

                    this.http.post<any>(backendURL, jsonToSend, httpOptions).subscribe(
                        response => {
                            console.log('Sent data: ', response);
                        },
                        error => {
                            console.error('Failed to register using 42: ', error);
                        }
                    );

                }else{
                    console.log('State must be register or login');
                }
                // Proceed with token exchange or authentication process
            } else {
                // Handle the absence of authorization code
                console.log('Authorization code or state not found');
                // Handle error or redirect to an error page
            }
        });
    }
}

