import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BlogPost, BlogPostService, MediaFile } from 'src/app/services/blog-post.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  posts: BlogPost[] = [];

  loading = true;
  errorMessage = '';

  // --- Lightbox / Modal state ---
  modalFile: MediaFile | null = null;
  modalOpen = false;

  constructor(private blogService: BlogPostService, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading = true;

    this.blogService.getAllPost().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = "Unable to load posts.";
        this.loading = false;
      }
    });
  }

  getSafeHtml(html: string): SafeHtml {
    // Angular's normal HTML binding sanitizes HTML.
    // Do not use bypassSecurityTrustHtml for user-authored posts.
    return this.sanitizer.sanitize(1, html) ?? '';
  }

  getMediaUrl(storagePath: string): string {
    return this.blogService.getMediaUrl(storagePath);
  }

  /** Open the lightbox modal for a clicked file */
  openModal(file: MediaFile): void {
    this.modalFile = file;
    this.modalOpen = true;
  }

  /** Close the lightbox modal */
  closeModal(): void {
    this.modalOpen = false;
    this.modalFile = null;
  }

  /** Close modal when clicking the backdrop */
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('media-modal-backdrop')) {
      this.closeModal();
    }
  }
}
