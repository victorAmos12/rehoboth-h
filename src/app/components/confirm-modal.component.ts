import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.css'],
})
export class ConfirmModalComponent implements OnInit {
  constructor(protected readonly modalService: ModalService) {}

  ngOnInit(): void {}

  onConfirm(): void {
    this.modalService.confirmAction();
  }

  onCancel(): void {
    this.modalService.cancelAction();
  }

  onBackdropClick(): void {
    this.onCancel();
  }
}
