import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Router } from '@angular/router';
import { Editor, Toolbar } from 'ngx-editor';

import { BlogPostService } from 'src/app/services/blog-post.service';

interface Role {
  id: number;
  name: string;
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

  saving = false;
  errorMessage = '';

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
    this.blogService.createPost({
      roleid: Number(formValue.roleid), title: title, description: description
    }).subscribe({
      next: (data) => {
        this.saving = false;
        this.router.navigate(['/']);
      }, error: (error) => {
        this.saving = false;
        this.errorMessage = error.error?.message ?? "unable to create post.";
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
