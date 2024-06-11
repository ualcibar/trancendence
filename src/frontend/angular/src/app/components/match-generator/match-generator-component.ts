import { Component, Output, Input, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MapsName } from '../../services/map.service';
import { MatchSettings } from '../../services/gameManager.service';
import { getEnumStrings, getNextEnumValue} from '../../utils/help_enum';
@Component({
  selector: 'app-match-generator-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './match-generator-component.html',
  styleUrl: './match-generator-component.css'
})
export class MatchGeneratorComponent {

  default : boolean = true;
  @Output() escapeKeyPressed: EventEmitter<void> = new EventEmitter<void>();
  @Input() settings! : MatchSettings;
  
  maps: string[] = [];

  ngOnInit() {
    this.maps = this.getMaps();
  }

  constructor(){
    
  }

  toggleDefault(){
    this.default = !this.default;
  }

  toggleMap(){
    this.settings.mapName = getNextEnumValue(MapsName ,this.settings.mapName)!;
  }
  changeMaxTime(event : any){
    console.log('changing')
    if (event.target.value){
      console.log('actually changed something')
      this.settings.maxTimeRoundSec = event.target.value;
    }
    console.log('after', this.settings)
  }

  onBlur() { 
    this.escapeKeyPressed.emit();
  }

  onKeyPress(event : any) {
    if (event.key === "Escape") {
      this.escapeKeyPressed.emit();
    }
  }

  getMaps() : string[]{
    console.log('this.settings.mapName', this.settings.mapName)
    console.log('maps', getEnumStrings(MapsName)
    .filter(val => val != this.settings.mapName) );
    return getEnumStrings(MapsName)
      .filter(val => val != this.settings.mapName) 
  }
}
