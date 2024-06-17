import { Component, Output, Input, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MapsName } from '../../services/map.service';
import { MatchSettings } from '../../services/gameManager.service';
import { getEnumStrings, getNextEnumValue} from '../../utils/help_enum';
import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-match-generator-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, TranslateModule
  ],
  templateUrl: './match-generator-component.html',
  styleUrl: './match-generator-component.css'
})
export class MatchGeneratorComponent {
  default : boolean = true;
  winPointsNotPossible: boolean = false;

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
    if (event.target.value)
      this.settings.maxTimeRoundSec = event.target.value;
  }

  changeRounds(event: any) {
    if (event.target.value) {
      if (event.target.value >= this.settings.roundsToWin) {
        this.winPointsNotPossible = false;
      } else {
        this.winPointsNotPossible = true;
      }
      this.settings.maxRounds = event.target.value;
    }
  }

  changeRoundsToWin(event: any) {
    if (event.target.value) {
      if (event.target.value > this.settings.maxRounds) {
        this.winPointsNotPossible = true;
        return;
      } else {
        this.winPointsNotPossible = false;
        this.settings.roundsToWin = event.target.value;
      }
    }
  }

  changeTeamSize(event: any) {
    if (event.target.value) {
      this.settings.teamSize = event.target.value;
    }
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
