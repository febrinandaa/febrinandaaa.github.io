'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFanpageById } from '@/lib/config';
import { ArrowLeft, Upload, Loader2, Sparkles, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ContentItem {
    id: string;
    file: File;
    preview: string;
    caption: string;
    isGenerating: boolean;
    isEdited: boolean;
}

export default function ContentManager() {
    const params = useParams();
    const router = useRouter();
    const pageId = params.pageId as string;
    const fanpage = getFanpageById(pageId);

    const [items, setItems] = useState<ContentItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);

    if (!fanpage) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Fanpage not found</h1>
                    <Link href="/" className="text-indigo-400 hover:text-indigo-300">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.slice(0, 10); // Max 10 files

        const newItems: ContentItem[] = validFiles.map((file, index) => ({
            id: `${Date.now()}-${index}`,
            file,
            preview: URL.createObjectURL(file),
            caption: '',
            isGenerating: false,
            isEdited: false,
        }));

        setItems(prev => [...prev, ...newItems].slice(0, 10));
    };

    const generateCaption = async (itemId: string) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, isGenerating: true } : item
        ));

        const item = items.find(i => i.id === itemId);
        if (!item) return;

        try {
            const formData = new FormData();
            formData.append('image', item.file);

            const response = await fetch('/api/content/generate-caption', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            setItems(prev => prev.map(i =>
                i.id === itemId
                    ? { ...i, caption: data.caption, isGenerating: false }
                    : i
            ));
        } catch (error) {
            console.error('Failed to generate caption:', error);
            setItems(prev => prev.map(i =>
                i.id === itemId ? { ...i, isGenerating: false } : i
            ));
        }
    };

    const generateAllCaptions = async () => {
        setIsGeneratingAll(true);

        for (const item of items) {
            if (!item.caption) {
                await generateCaption(item.id);
            }
        }

        setIsGeneratingAll(false);
    };

    const updateCaption = (itemId: string, caption: string) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, caption, isEdited: true } : item
        ));
    };

    const removeItem = (itemId: string) => {
        setItems(prev => prev.filter(item => item.id !== itemId));
    };

    const saveAll = async () => {
        setIsSaving(true);

        try {
            const formData = new FormData();
            formData.append('pageId', pageId);

            items.forEach((item, index) => {
                formData.append(`files`, item.file);
                formData.append(`captions`, item.caption);
            });

            const response = await fetch('/api/content/save-all', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                alert('Content saved successfully!');
                setItems([]);
                router.push('/');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save content');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-300" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white">{fanpage.name}</h1>
                            <p className="text-xs text-slate-400">Content Manager</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Upload Section */}
                <div className="mb-8">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-600 rounded-2xl cursor-pointer bg-slate-800/30 hover:bg-slate-800/50 hover:border-indigo-500/50 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-10 h-10 text-slate-400 mb-3" />
                            <p className="mb-2 text-sm text-slate-300">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-slate-500">PNG, JPG (max 10 files, 4MB each)</p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                    </label>
                </div>

                {/* Generate All Button */}
                {items.length > 0 && (
                    <div className="mb-6 flex gap-3">
                        <button
                            onClick={generateAllCaptions}
                            disabled={isGeneratingAll}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg transition-all disabled:opacity-50"
                        >
                            {isGeneratingAll ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            Generate All Captions
                        </button>
                    </div>
                )}

                {/* Content Items */}
                <div className="space-y-6">
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 flex gap-6"
                        >
                            {/* Image Preview */}
                            <div className="flex-shrink-0">
                                <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-700">
                                    <img
                                        src={item.preview}
                                        alt={`Upload ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>

                            {/* Caption Section */}
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-400">
                                        Image {index + 1}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => generateCaption(item.id)}
                                            disabled={item.isGenerating}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {item.isGenerating ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Sparkles className="w-3 h-3" />
                                            )}
                                            AI Caption
                                        </button>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    value={item.caption}
                                    onChange={(e) => updateCaption(item.id, e.target.value)}
                                    placeholder="Caption will appear here after AI generation..."
                                    className="w-full h-24 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Save Button */}
                {items.length > 0 && (
                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={saveAll}
                            disabled={isSaving || items.some(i => !i.caption)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            Save All to Drive
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
