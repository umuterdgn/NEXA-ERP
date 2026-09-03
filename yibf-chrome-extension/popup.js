/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Nexa ERP - YİBF Aktarıcı Popup Script
 */

document.addEventListener('DOMContentLoaded', () => {
  const importButton = document.getElementById('importButton')
  const statusDiv = document.getElementById('status')

  importButton.addEventListener('click', async () => {
    // Show loading state
    importButton.disabled = true
    importButton.innerHTML = `
      <div class="spinner"></div>
      Veri Çekiliyor...
    `
    statusDiv.className = 'status loading'
    statusDiv.textContent = 'YİBF sayfasından veriler çekiliyor...'

    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      if (!tab) {
        throw new Error('Aktif sekme bulunamadı')
      }

      // Execute content script
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      })

      if (results && results[0]) {
        const result = results[0].result

        if (result.success) {
          statusDiv.className = 'status success'
          statusDiv.textContent = `✓ ${result.message}`
          importButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Aktarım Başarılı
          `
          
          // Reset button after 3 seconds
          setTimeout(() => {
            importButton.disabled = false
            importButton.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              YİBF Verilerini Nexa'ya Aktar
            `
            statusDiv.style.display = 'none'
          }, 3000)
        } else {
          throw new Error(result.message || 'Veri çekme başarısız')
        }
      } else {
        throw new Error('Script çalıştırılamadı')
      }
    } catch (error) {
      console.error('Import error:', error)
      statusDiv.className = 'status error'
      statusDiv.textContent = `✗ ${error.message || 'Bir hata oluştu'}`
      importButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Tekrar Dene
      `
      importButton.disabled = false
    }
  })
})
