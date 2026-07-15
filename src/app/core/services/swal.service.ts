import { Injectable } from '@angular/core';
import Swal, { SweetAlertOptions } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class SwalService {
  private readonly base: SweetAlertOptions = {
    background: '#26262E',
    color: '#ECECF0',
    confirmButtonColor: '#3B82F6',
    customClass: {
      popup: 'swal-corporate-popup',
      title: 'swal-corporate-title',
      htmlContainer: 'swal-corporate-text',
      confirmButton: 'swal-corporate-confirm',
      cancelButton: 'swal-corporate-cancel',
    },
  };

  confirmDelete(entity: string = 'elemento'): Promise<boolean> {
    return Swal.fire({
      ...this.base,
      title: '¿Confirmar eliminación?',
      html: `Esta acción eliminará el <strong style="color:#E8F0FF">${entity}</strong> de forma permanente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then(r => r.isConfirmed);
  }

  confirmAction(title: string, text: string, confirmText = 'Confirmar'): Promise<boolean> {
    return Swal.fire({
      ...this.base,
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then(r => r.isConfirmed);
  }

  loading(title: string = 'Procesando...', text: string = 'Por favor espere'): void {
    Swal.fire({
      ...this.base,
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });
  }

  close(): void {
    Swal.close();
  }

  success(title: string, text?: string): Promise<any> {
    return Swal.fire({
      ...this.base,
      title,
      text,
      icon: 'success',
      timer: 2200,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  }

  error(title: string, text?: string): Promise<any> {
    return Swal.fire({ ...this.base, title, text, icon: 'error' });
  }
}
