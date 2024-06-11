import { trigger, style, transition, animate } from '@angular/animations';

export const easeOut = trigger (
    'easeOut', [
        transition(':enter', [
            style({transform: 'translateX(0)', opacity: 0}),
            animate('200ms cubic-bezier(0, 0, 0.2, 1)', style({transform: 'translateX(0)', opacity: 1}))
        ]),
        transition(':leave', [
            style({transform: 'translateX(0)', opacity: 1}),
            animate('200ms cubic-bezier(0, 0, 0.2, 1)', style({transform: 'translateX(0)', opacity: 0}))
        ])
    ]
);