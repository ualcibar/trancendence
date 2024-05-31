import { Component, Output, Input, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


import { OnlineMatchSettings2 } from '../../services/matchmaking.service';
import { MatchGeneratorComponent } from '../match-generator/match-generator-component';
@Component({
  selector: 'app-online-match-generator-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatchGeneratorComponent
  ],
  templateUrl: './online-match-generator-component.html',
  styleUrl: './online-match-generator-component.css'
})
export class OnlineMatchGeneratorComponent {
  default : boolean = true;
  @Output() escapeKeyPressed: EventEmitter<void> = new EventEmitter<void>();
  @Input() settings! : OnlineMatchSettings2;
  

  constructor(){
    
  } 
  toggleDefault(){
    this.default = !this.default;
  }  

  onBlur() { 
    this.escapeKeyPressed.emit();
  }

  onKeyPress(event : any) {
    if (event.key === "Escape") {
      this.escapeKeyPressed.emit();
    }
  }
  changeName(event : any){
    if (event.target.value){
      this.settings.name = event.target.value;
    }
  }
  changeTags(event : any){
    if (event.target.value){
      this.settings.name = event.target.value;
    }
  }
  changePublic(event : any){
    if (event.target.value){
      this.settings.name = event.target.value;
    }
  }
}
