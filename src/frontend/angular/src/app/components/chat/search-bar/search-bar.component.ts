import { Component, EventEmitter, Output, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { AfterViewInit, Renderer2 } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AsyncPipe, TranslateModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css'

})
export class SearchBarComponent implements OnInit, AfterViewInit{
  @Output() escapeKeyPressed: EventEmitter<void> = new EventEmitter<void>();
  @Output() selectedField: EventEmitter<string> = new EventEmitter<string>();
  @Input() fields : string[] = [];

  myControl = new FormControl<string>('');
  filteredOptions$: Observable<string[]>;
  errorMessage: string = '';

  @ViewChild('inputField') inputField!: ElementRef;

  ngAfterViewInit() {
    // Focus the input field programmatically when the component is initialized
    this.inputField.nativeElement.focus();
  }

  onBlur() {
    // Emit the outOfFocus event when the input field loses focus
    this.escapeKeyPressed.emit();
  }

  constructor(private renderer: Renderer2){
    this.filteredOptions$ = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        return value ? this._filter(value as string) : this.fields.slice();
      }),
    );
  }

  ngOnInit() {
    this.filteredOptions$ = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        return value ? this._filter(value as string) : this.fields.slice();
      }),
    );
  }
  // Method to handle Escape key press event
  onKeyPress(event : any) {
    if (event.key === "Escape") {
      this.escapeKeyPressed.emit();
    }if (event.key === "Enter") {
      if (this.myControl.value)
        this.selectedField.emit(this.myControl.value);
      else
        this.escapeKeyPressed.emit();
    }
  }

  onEnter() {
    this.selectedField.emit();
  }

  onFormSubmit() {
    if (this.myControl.value) {
      this.selectedField.emit(this.myControl.value);
    } else {
      this.errorMessage = 'You must type a username!';
    }
  }

  autocomplete(username : string){
    this.myControl.setValue(username);
    this.inputField.nativeElement.focus();
  }
  
  private _filter(name: string): string[] {
    const filterValue = name.toLowerCase();
    return this.fields.filter(field => field.toLowerCase().includes(filterValue));
  }
}
