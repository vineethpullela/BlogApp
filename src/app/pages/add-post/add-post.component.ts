import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Router } from '@angular/router';
import { Editor, Toolbar } from 'ngx-editor';

import { BlogPostService } from 'src/app/services/blog-post.service';

interface Role {
  id: number;
  name: string;
}

export type MediaType = 'image' | 'audio' | 'video';
export interface SelectedMedia {
  file: File;
  mediaType: MediaType;
}

@Component({
  selector: 'app-add-post',
  templateUrl: './add-post.component.html',
  styleUrls: ['./add-post.component.css']
})

export class AddPostComponent implements OnInit, OnDestroy {
  editor!: Editor;
  postForm!: FormGroup;

  // Later I need to load the role form .net web api
  roles: Role[] = [{ id: 1, name: 'Anonymous' }]
  rolename = 'Anonymous';

  selectedFiles: SelectedMedia[] = [];

  saving = false;
  errorMessage = '';

  private readonly maxFiles = 20;
  private readonly maxFileSizeBytes = 100 * 1024 * 1024; // 100 MB per file limit

  toolbar: Toolbar = [
    ['bold', 'italic', 'underline'],
    ['bullet_list', 'ordered_list'],
    ['blockquote'], ['align_left', 'align_center', 'align_right', 'align_justify'], ['link']
  ];
  constructor(private fb: FormBuilder, private blogService: BlogPostService, private router: Router) { }

  ngOnInit(): void {


    this.editor = new Editor();
    const defaultRole = this.roles.find(role => role.name == 'Anonymous');

    this.postForm = this.fb.group({
      roleid: [defaultRole?.id ?? null, Validators.required],
      title: ['', [Validators.required, Validators.maxLength(150)]],
      description: ['', Validators.required]
    })
  }

  get roleName(): string {

    const roleId = this.postForm?.get('roleid')?.value;
    return this.roles.find(role => role.id == Number(roleId))?.name ?? '';
  }


  //Extensible media selection  - work with both 1 onFilesSelected($event) [auto-detects type] and 3 onFilesSelected($event, 'image') buttons

  onFilesSelected(event: Event, explicitType?: MediaType): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.errorMessage = "";

    for (const file of Array.from(input.files)) {
      if (this.selectedFiles.length >= this.maxFiles) {
        this.errorMessage = `you can upload a maximum of  ${this.maxFiles}`;
        break;
      }
      if (file.size <= 0) continue;
      if (file.size > this.maxFileSizeBytes) {
        this.errorMessage = `${file.name}  exceeds the 100MB limit.`;
        continue;
      }

      const mediaType = explicitType ?? this.detectMediaType(file);
      if (!mediaType) {
        this.errorMessage = `Unsupport format for  "${file.name}"`;
        continue
        ;
      }

      // Avoid duplicates
      const isDuplicate = this.selectedFiles.some(
        item => item.file.name === file.name && item.file.size === file.size
      );
      if (!isDuplicate) {
        this.selectedFiles.push({ file, mediaType });
      }
    }
    input.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
  private detectMediaType(file: File): MediaType | null {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return 'image';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) return 'audio';
    if (['mp4', 'webm', 'mov', 'mkv'].includes(ext || '')) return 'video';
    return null;
  }

  private getPlainText(html: string): string {
    const element = document.createElement('div');

    element.innerHTML = html || '';

    return (element.textContent || element.innerText || '').replace(/\u00a0/g, '').trim();
  }

  addpost(): void {
    this.errorMessage = '';

    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }

    const formValue = this.postForm.getRawValue();
    const title = formValue.title.trim();
    const description = formValue.description || '';
    if (!title) {
      this.errorMessage = "please enter a title.";
      return;
    }
    const plainText = this.getPlainText(description);
    if (!plainText) {
      this.errorMessage = "please enter a descrption";
      return;
    }
    this.saving = true;
// phase 1 no files 
 if (this.selectedFiles.length === 0) {
      this.blogService.createPost({
        roleid: Number(formValue.roleid),
        title: title,
        description: description
      }).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.saving = false;
          this.errorMessage = error.error?.message ?? 'Unable to create post.';
        }
      });
      return;
    }

    //Phase 2 (with media): multipart end point
     const formData = new FormData();
    formData.append('RoleId', String(formValue.roleid));
    formData.append('Title', title);
    formData.append('Description', description);
    for (const item of this.selectedFiles) {
      formData.append('Files', item.file, item.file.name);
    }



    //initial implementation 

  //   this.blogService.createPost({
  //     roleid: Number(formValue.roleid), title: title, description: description
  //   }).subscribe({
  //     next: (data) => {
  //       this.saving = false;
  //       this.router.navigate(['/']);
  //     }, error: (error) => {
  //       this.saving = false;
  //       this.errorMessage = error.error?.message ?? "unable to create post.";
  //     }
  //   });
  // }



  /// with media implementation
   this.blogService.createPostWithMedia(formData).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error.error?.message ?? 'Unable to create post.';
      }
    });
  }







  cancel(): void {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }
}
