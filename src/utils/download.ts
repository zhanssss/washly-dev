import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { api } from '@/contexts/AuthContext';

export async function downloadAndShare(
    url: string,
    filename: string,
    headers: Record<string, string> = {}
) {
    const dir = new Directory(Paths.document, 'exports');
    await dir.create({ idempotent: true, intermediates: true });

    const file = new File(dir, filename);

    // Используем общий axios-инстанс
    const res = await api.get<ArrayBuffer>(url, {
        headers,
        responseType: 'arraybuffer',
    });

    const bytes = new Uint8Array(res.data);
    await file.write(bytes);

    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri);
    }

    return file.uri;
}
