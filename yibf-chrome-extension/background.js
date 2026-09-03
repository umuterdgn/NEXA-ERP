/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - YİBF Aktarıcı Background Service Worker
 */

// Background service worker for Manifest V3
chrome.runtime.onInstalled.addListener(() => {
  console.log('Nexa ERP YİBF Aktarıcı eklentisi yüklendi')
})

// Handle extension icon click if needed
chrome.action.onClicked.addListener((tab) => {
  console.log('Eklenti ikonuna tıklandı:', tab.url)
})
