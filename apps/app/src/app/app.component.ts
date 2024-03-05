import { JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  selector: 'zps-root',
  template: `
    <h2>Hello</h2>

    {{ dataSignal() | json }}
  `,
  styles: ``,
  imports: [
    JsonPipe
  ]
})
export class AppComponent {
  #http = inject(HttpClient);

  #data$ = this.#http.get('https://api-14-3000.prg1.zerops.app/');

  dataSignal = toSignal(this.#data$);
}
