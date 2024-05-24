import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { UserProfileComponent } from './pages/profile/user-profile/user-profile.component';
import { NotFoundComponent } from './components/errors/not-found/not-found.component';
import { TestComponent } from './pages/test/test.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { PlayComponent } from './pages/play/play.component';


const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'play', component: PlayComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'profile', component: ProfileComponent, children: [
    { path: ':userId', component: UserProfileComponent }
  ]},
  { path: 'test', component: TestComponent},
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
