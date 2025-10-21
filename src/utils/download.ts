// src/utils/download.ts
import { File, Directory, Paths } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import * as Sharing from 'expo-sharing';

export async function downloadAndShare(
    url: string,
    filename: string,
    headers: Record<string, string> = {}
) {
    const dir = new Directory(Paths.document, 'exports');
    await dir.create({ idempotent: true, intermediates: true });

    const file = new File(dir, filename);

    const res = await fetch(url, { headers, method: 'GET' });
    if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(`Download failed: ${res.status} ${msg}`);
    }

    const bytes = await res.bytes();
    await file.write(bytes);

    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri);
    }
    return file.uri;
}
