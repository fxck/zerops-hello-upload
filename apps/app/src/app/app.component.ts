import { JsonPipe, NgStyle } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from 'rxjs';

type Targets = 'OBJECT_STORAGE' | 'SHARED_STORAGE';

interface FileEntity {
  id: number;
  filename: string;
  path: string;
  target: Targets;
}

@Component({
  standalone: true,
  selector: 'zps-root',
  template: `

    <mat-card [ngStyle]="{
      margin: '40px auto',
      maxWidth: '500px',
      padding: '40px'
    }">

      <input
        #inputRef
        accept="image/*"
        type="file"
        hidden
        (change)="onFileSelected($event)"
      />

      @if (selectedFile()) {
        <mat-card [ngStyle]="{
          padding: '20px',
          margin: '20px'
        }">
          <h3>{{ selectedFile()?.name }}</h3>
          <pre>{{ selectedMetaData() | json }}</pre>
        </mat-card>
      }

      <button
        [ngStyle]="{
          marginTop: '20px'
        }"
        mat-stroked-button
        (click)="inputRef.click()">
        <mat-icon>file_upload</mat-icon> Select file
      </button>

      <div [ngStyle]="{ marginTop: '20px' }">
        <mat-radio-group [value]="selectedTarget()" (change)="selectedTarget.set($event.value)">
          <mat-radio-button [value]="'OBJECT_STORAGE'">Object Storage</mat-radio-button>
          <mat-radio-button [value]="'SHARED_STORAGE'">Shared Storage</mat-radio-button>
        </mat-radio-group>
      </div>

      <button
        [ngStyle]="{
          marginTop: '20px'
        }"
        [disabled]="uploading()"
        color="accent"
        mat-flat-button
        (click)="upload()">
        Upload
      </button>

    </mat-card>

    <div [ngStyle]="{
      maxWidth: '800px',
      margin: '0px auto',
      textAlign: 'center'
    }">
      @for (item of data(); track $index) {
        <mat-card [ngStyle]="{
          display: 'inline-block',
          maxWidth: '200px',
          width: '100%',
          verticalAlign: 'top',
          margin: '10px'
        }">
          <h4>{{ item.filename }}</h4>
          <h5>{{ item.target }}</h5>
          <img
            [ngStyle]="{
              display: 'block',
              width: '100%'
            }"
            [src]="item.path"
          />
        </mat-card>
      }
    </div>

  `,
  imports: [
    NgStyle,
    MatButtonModule,
    MatCardModule,
    MatCardModule,
    MatIconModule,
    JsonPipe,
    MatRadioModule
  ]
})
export class AppComponent {
  #destroyRef = inject(DestroyRef);
  #http = inject(HttpClient);
  #data$ = new BehaviorSubject<FileEntity[]>([]);

  selectedFile = signal<File | undefined>(undefined);
  selectedTarget = signal<Targets>('OBJECT_STORAGE');
  selectedMetaData = computed(() => {
    const file = this.selectedFile();
    if (!file) { return undefined; }
    return {
      name: file.name,
      lastModified: file.lastModified,
      size: file.size,
      type: file.type
    };
  });
  uploading = signal(false);
  data = toSignal(this.#data$);

  constructor() {
    this.#loadData();
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    this.selectedFile.set(target.files ? target.files[0] : undefined);
  }

  upload() {
    const selectedFile = this.selectedFile();

    if (!selectedFile) { return; }

    this.uploading.set(true);

    const formData = new FormData();

    formData.append(
      'file',
      selectedFile,
      selectedFile.name
    );
    formData.append(
      'target',
      'OBJECT_STORAGE'
    );

    this.#http
      .post('https://api-14-3000.prg1.zerops.app/upload', formData)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (response) => {
          console.log('Upload successful', response);
          this.#loadData();
        },
        error: (error) => console.error('Upload failed', error),
        complete: () => this.uploading.set(false)
      });

  }

  #loadData() {
    this.#http
      .get<FileEntity[]>('https://api-14-3000.prg1.zerops.app')
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((d) => this.#data$.next(d))
  }

}
