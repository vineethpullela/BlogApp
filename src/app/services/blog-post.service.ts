import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MediaFile {
  originalName: string;
  mediaType: 'image' | 'audio' | 'video' | string;
  contentType: string;
  fileSize: number;
  storageProvider: string;
  storagePath: string;
}
export interface BlogPost {
  id: number;
  title: string;
  description: string;
  roleId: number;
  roleName: string;
  createdAt: string;
  updatedAt: string;
  mediaFiles?: MediaFile[];
}


@Injectable({
  providedIn: 'root'
})
export class BlogPostService {
private readonly apiUrl= 'http://localhost:5234/api/BlogPost'
  constructor(private http: HttpClient) {}

  getAllPost(){
      return this.http.get<any[]>(this.apiUrl);
    }

    //Phase 1:  obervable text-only method 
    createPost(data:any){
      //  const headers = new HttpHeaders()
      // .set('Content-Type', 'application/json');
      return this.http.post(this.apiUrl,data);
    }


    //Phase 2 new cerate post with media
    createPostWithMedia(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/with-media`, formData);
  }


  // helper method to get a video stream and audio 

  getMediaUrl(storagePath: string): string {
    if (!storagePath) return '';
    if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
      return storagePath;
    }
    return `${this.apiUrl}/media/${encodeURIComponent(storagePath)}`;
  }



}