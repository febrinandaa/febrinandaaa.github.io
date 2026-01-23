// Fanpage configuration
export interface Fanpage {
    id: string; // Internal ID (FP_1)
    name: string;
    fbPageId?: string; // Real Facebook Page ID
    folderId?: string;
    accessToken?: string;
}

export const FANPAGES: Fanpage[] = [
    { id: 'FP_1', name: 'Logika Rasa', fbPageId: '861658547041751' },
    { id: 'FP_2', name: 'Goresan Tinta', fbPageId: '923965544136171' },
    { id: 'FP_3', name: 'Nasihat Kehidupan', fbPageId: '936323136233465' },
    { id: 'FP_4', name: 'Filosofi Kehidupan', fbPageId: '926498347218647' },
    { id: 'FP_5', name: 'Menjadi Manusia', fbPageId: '952318724629438' },
    { id: 'FP_6', name: 'Ayu Ting Ting Fans', fbPageId: '108926341958443' },
    { id: 'FP_7', name: 'Umi Pipik Dian Irawati', fbPageId: '109076001914253' },

    { id: 'FP_9', name: 'Inspirasi Bunda', fbPageId: '346791042909227' },
    { id: 'FP_10', name: 'Makkah Madinah', fbPageId: '1755858221383390' },
];

export function getFanpageById(id: string): Fanpage | undefined {
    return FANPAGES.find(fp => fp.id === id);
}
