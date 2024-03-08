import { Injectable, OnInit} from '@angular/core';
import { BehaviorSubject, Observable, of} from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnInit{
  private isLoggedInSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {
    this.amILoggedIn().subscribe(value => {
      this.isLoggedInSubject.next(value);
    });
  }
  ngOnInit() {
    this.amILoggedIn().subscribe(value => {
      this.isLoggedInSubject.next(value);
    });
  }

  amILoggedIn(): Observable<boolean>{
    const backendURL = 'http://localhost:8000/polls/imLoggedIn';
    return this.http.get<any>(backendURL, { withCredentials: true })
      .pipe(
        map(response => true), // Map successful response to true
        catchError(error => of(false)) // Catch errors and map to false
      );
  }


  login(){
    this.isLoggedInSubject.next(true);
  }

  logout() {
    const backendURL = 'http://localhost:8000/polls/logout/';
    this.http.post<any>(backendURL, {},{withCredentials: true}).subscribe(
      response => {
        console.log('Sent data: ', response);
      },
      error => {
        console.error('An error ocurred trying to contact the registration server: ', error);
      }
    );
    var accessToken = localStorage.getItem('access_token');
    // Logic to perform logout
    if (accessToken) {
      localStorage.removeItem('access_token');
    }
    this.isLoggedInSubject.next(false);
  }
}
