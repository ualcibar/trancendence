import { trigger, state, style, transition, animate } from '@angular/animations';

export const slideInFromRight = trigger('slideInFromRight', [
  state('void', style({ opacity: 0, transform: 'translateX(100%)' })), // Initial state for enter transition
  state('*', style({ opacity: 1, transform: 'translateX(0)' })), // Final state for enter transition
  transition(':enter, :leave', animate('0.3s ease')), // Animation for enter and leave transitions
]);