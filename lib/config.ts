// Fanpage configuration
export interface Fanpage {
    id: string;
    name: string;
    folderId?: string;
    accessToken?: string;
}

export const FANPAGES: Fanpage[] = [
    { id: 'FP_1', name: 'Fanpage 1' },
    { id: 'FP_2', name: 'Fanpage 2' },
    { id: 'FP_3', name: 'Fanpage 3' },
    { id: 'FP_4', name: 'Fanpage 4' },
    { id: 'FP_5', name: 'Fanpage 5' },
    { id: 'FP_6', name: 'Fanpage 6' },
    { id: 'FP_7', name: 'Fanpage 7' },
    { id: 'FP_8', name: 'Fanpage 8' },
    { id: 'FP_9', name: 'Fanpage 9' },
    { id: 'FP_10', name: 'Fanpage 10' },
];

export function getFanpageById(id: string): Fanpage | undefined {
    return FANPAGES.find(fp => fp.id === id);
}
