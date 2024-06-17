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
  changeToPublic(bubble : HTMLElement){
    console.log('to public')
    if (!this.settings.publicMatch){
      this.settings.publicMatch = true
      this.moveBubble(0, bubble)
    }
  }
  changeToPrivate(bubble : HTMLElement){
    console.log('to private')
    if (this.settings.publicMatch){
      this.settings.publicMatch = false
      this.moveBubble(1, bubble)
    }
  }
  moveBubble(index: number, bubble: HTMLElement){
    bubble.style.transform = `translateX(${index * 150}px)`
  }
}
