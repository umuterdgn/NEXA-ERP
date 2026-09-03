/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */
import Dexie, { Table } from 'dexie';

export interface OfflineReport {
  id?: number; // Tarayıcı içi geçici ID
  projectId: string;
  reportId?: string; // Güncelleme işlemleri için mevcut rapor ID'si
  title?: string;
  description: string;
  findings?: string;
  markedBlueprintBase64?: string; // İnternet yokken resimler base64 olarak tutulmalı
  markedPhotoBase64?: string;
  dxfBase64?: string; 
  createdAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  operation?: 'create' | 'update'; // İşlem türü
}

export class NexaOfflineDB extends Dexie {
  offlineReports!: Table<OfflineReport>;

  constructor() {
    super('NexaOfflineDB');
    this.version(2).stores({
      offlineReports: '++id, projectId, syncStatus, reportId, operation'
    });
  }
}

export const db = new NexaOfflineDB();