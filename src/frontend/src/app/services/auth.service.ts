import { Injectable, OnInit} from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnInit{
  private isLoggedInSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {
    this.isLoggedInSubject.next(this.amILoggedIn());
  }
  ngOnInit(){
    this.isLoggedInSubject.next(this.amILoggedIn());
  }

    amILoggedIn(): boolean {
        // Logic to perform login
        const backendURL = 'http://localhost:8000/polls/imLoggedIn';
        this.http.get<any>(backendURL, { withCredentials: true }).subscribe(
            response => {
                return true;
            },
            error => {
                return false;
            }
        );
        return false;
    }


  login(){
    this.isLoggedInSubject.next(true);
  }

  logout() {
    // Logic to perform logout
    this.isLoggedInSubject.next(false);
  }
}
