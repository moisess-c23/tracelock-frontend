import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${path}`).pipe(
      catchError(this.handleError)
    );
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${path}`, body).pipe(
      catchError(this.handleError)
    );
  }

  put<T>(path: string, body: any, id: string): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${path}/${id}`, body).pipe(
      catchError(this.handleError)
    );
  }

  delete<T>(path: string, id?: string): Observable<T> {
    const url = id ? `${this.apiUrl}/${path}/${id}` : `${this.apiUrl}/${path}`;
    return this.http.delete<T>(url).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => new Error(error.message || 'Error en el servidor de TraceLock.'));
  }
}
