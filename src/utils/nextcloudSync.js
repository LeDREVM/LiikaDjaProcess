// Stubs Nextcloud — synchronisation optionnelle (non configurée par défaut)

export function loadNextcloudConfig() {
  try {
    const raw = localStorage.getItem('ld-nextcloud-config');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveNextcloudConfig(config) {
  localStorage.setItem('ld-nextcloud-config', JSON.stringify(config));
}

export async function testNextcloudConnection() {
  return { success: false, message: 'Nextcloud non configuré' };
}

export async function syncToNextcloud() {
  return { success: false, message: 'Nextcloud non configuré' };
}

export async function fetchFromNextcloud() {
  return { success: false, message: 'Nextcloud non configuré' };
}

export async function syncModule() {
  return { success: false, message: 'Nextcloud non configuré' };
}

export async function fetchModule() {
  return { success: false, message: 'Nextcloud non configuré' };
}
