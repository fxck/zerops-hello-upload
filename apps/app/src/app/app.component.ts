import { JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  selector: 'zps-root',
  template: `
    <h2>Hello</h2>

    <input type="file" (change)="onFileSelected($event)">
    <button (click)="upload()">Upload</button>

    {{ dataSignal() | json }}
  `,
  styles: ``,
  imports: [
    JsonPipe
  ]
})
export class AppComponent {
  #http = inject(HttpClient);
  #data$ = this.#http.get('http://93.185.106.132:3000');
  dataSignal = toSignal(this.#data$);

  selectedFile!: File | null;

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedFile = target.files ? target.files[0] : null;
  }

  upload() {
    if (!this.selectedFile) { return; }
    const formData = new FormData();

    formData.append('file', this.selectedFile, this.selectedFile.name);
    formData.append('target', 'OBJECT_STORAGE');

    this.#http.post('https://api-14-3000.prg1.zerops.app/upload', formData).subscribe({
      next: (response) => console.log('Upload successful', response),
      error: (error) => console.error('Upload failed', error)
    });

  }
}
