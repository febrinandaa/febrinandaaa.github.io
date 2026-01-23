'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFanpageById } from '@/lib/config';
import { Upload, Loader2, Sparkles, Save, Trash2, X, Maximize2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import SidebarLayout from '@/components/SidebarLayout';

interface ContentItem {
    id: string;
    file: File;
    preview: string;
    caption: string;
    isGenerating: boolean;
    isEdited: boolean;
}

interface StockItem {
    id: string;
    cloudinary_url?: string;
    cloudinary_public_id?: string;
    drive_file_id?: string; // Legacy support
    base_caption: string;
    file_name: string;
    status: string;
    created_at: string;
}

export default function ContentManager() {
    const params = useParams();
    const router = useRouter();
    const pageId = params.pageId as string;
    const fanpage = getFanpageById(pageId);

    const [items, setItems] = useState<ContentItem[]>([]);
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);
    const [previewImage, setPreviewImage] = useState<{ url: string, caption: string } | null>(null);

    const fetchStock = async () => {
        try {
            const res = await fetch(`/api/content/list?pageId=${pageId}`);
            const data = await res.json();
            if (data.items) {
                setStockItems(data.items);
            }
        } catch (error) {
            console.error('Failed to fetch stock:', error);
        }
    };

    // Fetch Stock Data
    useEffect(() => {
        if (fanpage) {
            fetchStock();
        }
    }, [fanpage, pageId]);

    const deleteStockItem = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            const res = await fetch('/api/content/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, pageId })
            });

            if (res.ok) {
                // Optimistic update
                setStockItems(prev => prev.filter(item => item.id !== id));
            } else {
                alert('Failed to delete item');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete item');
        }
    };

    if (!fanpage) {
        return (
            <SidebarLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Fanpage not found</h1>
                        <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </SidebarLayout>
        );
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.slice(0, 638); // Max 638 files (target stock)

        const newItems: ContentItem[] = validFiles.map((file, index) => ({
            id: `${Date.now()}-${index}`,
            file,
            preview: URL.createObjectURL(file),
            caption: '',
            isGenerating: false,
            isEdited: false,
        }));

        // Add items to state
        setItems(prev => [...prev, ...newItems].slice(0, 638));

        // Auto-generate captions and save sequentially
        for (let i = 0; i < newItems.length; i++) {
            const item = newItems[i];

            // Wait 4 seconds between each (safe for 638 images - prevents rate limits)
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 4000));
            }

            // Generate caption and auto-save
            await generateAndSaveItem(item);
        }
    };

    // Auto-generate caption then immediately save to Cloudinary
    const generateAndSaveItem = async (item: ContentItem) => {
        // Mark as generating
        setItems(prev => prev.map(i =>
            i.id === item.id ? { ...i, isGenerating: true } : i
        ));

        try {
            // Step 1: Generate caption
            const captionFormData = new FormData();
            captionFormData.append('image', item.file);

            const captionRes = await fetch('/api/content/generate-caption', {
                method: 'POST',
                body: captionFormData,
            });

            const captionData = await captionRes.json();
            const caption = captionData.caption || '';

            if (!caption) {
                throw new Error('Failed to generate caption');
            }

            // Update state with caption
            setItems(prev => prev.map(i =>
                i.id === item.id ? { ...i, caption, isGenerating: false } : i
            ));

            // Step 2: Save to Cloudinary + Firestore
            const saveFormData = new FormData();
            saveFormData.append('pageId', pageId);
            saveFormData.append('files', item.file);
            saveFormData.append('captions', caption);

            const saveRes = await fetch('/api/content/save-all', {
                method: 'POST',
                body: saveFormData,
            });

            if (saveRes.ok) {
                // Remove from queue after successful save
                setItems(prev => prev.filter(i => i.id !== item.id));
                // Refresh stock count
                fetchStock();
            } else {
                console.error('Failed to save item');
            }
        } catch (error) {
            console.error('Failed to process item:', error);
            setItems(prev => prev.map(i =>
                i.id === item.id ? { ...i, isGenerating: false } : i
            ));
        }
    };

    // Legacy function for manual generation (kept for manual retry)
    const generateCaptionForItem = async (item: ContentItem) => {
        setItems(prev => prev.map(i =>
            i.id === item.id ? { ...i, isGenerating: true } : i
        ));

        try {
            const formData = new FormData();
            formData.append('image', item.file);

            const response = await fetch('/api/content/generate-caption', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            setItems(prev => prev.map(i =>
                i.id === item.id
                    ? { ...i, caption: data.caption || '', isGenerating: false }
                    : i
            ));
        } catch (error) {
            console.error('Failed to generate caption:', error);
            setItems(prev => prev.map(i =>
                i.id === item.id ? { ...i, isGenerating: false } : i
            ));
        }
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

            items.forEach((item) => {
                formData.append(`files`, item.file);
                formData.append(`captions`, item.caption);
            });

            const response = await fetch('/api/content/save-all', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                alert('Content saved successfully!');
                setItems([]);
                fetchStock(); // Refresh gallery
            } else {
                throw new Error(data.error || 'Failed to save');
            }
        } catch (error: any) {
            console.error('Failed to save:', error);
            alert(error.message || 'Failed to save content');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SidebarLayout>
            <div className="p-8 pb-32">
                {/* Header with Profile */}
                <div className="mb-8 flex items-center gap-4">
                    <div className="relative w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-indigo-500 shadow-md">
                        {fanpage.fbPageId ? (
                            <Image
                                src={`https://graph.facebook.com/${fanpage.fbPageId}/picture?type=large`}
                                alt={fanpage.name}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        ) : (
                            <span className="text-xl font-bold text-slate-500 dark:text-slate-400">{pageId.replace('FP_', '')}</span>
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{fanpage.name}</h1>
                        <p className="text-slate-500 dark:text-slate-400">Content Manager</p>
                    </div>
                </div>

                {/* Upload Section */}
                <div className="mb-8">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-10 h-10 text-slate-400 mb-3" />
                            <p className="mb-2 text-sm text-slate-500 dark:text-slate-300">
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">PNG, JPG (max 10 files, 4MB each)</p>
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

                {/* New Upload Items */}
                <div className="space-y-6">
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            className="bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 flex gap-6 backdrop-blur-sm shadow-sm"
                        >
                            {/* Image Preview */}
                            <div className="flex-shrink-0 group relative">
                                <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 cursor-pointer" onClick={() => setPreviewImage({ url: item.preview, caption: item.caption })}>
                                    <img
                                        src={item.preview}
                                        alt={`Upload ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            </div>

                            {/* Caption Section */}
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        New Upload {index + 1}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => generateCaption(item.id)}
                                            disabled={item.isGenerating}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-50/50 dark:bg-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300 rounded-lg transition-colors disabled:opacity-50"
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
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50/50 dark:bg-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/30 text-red-600 dark:text-red-300 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>

                                <textarea
                                    value={item.caption}
                                    onChange={(e) => updateCaption(item.id, e.target.value)}
                                    placeholder="Caption will appear here after AI generation..."
                                    className="w-full h-24 px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Stock Count - Simple display */}
                {stockItems.length > 0 && (
                    <div className="mt-8 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                            <div>
                                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {stockItems.length}
                                </span>
                                <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                                    gambar ready di stock
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Save Button */}
                {items.length > 0 && (
                    <div className="fixed bottom-6 right-6 z-10">
                        <button
                            onClick={saveAll}
                            disabled={isSaving || items.some(i => !i.caption)}
                            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/30 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            {isSaving ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <Save className="w-6 h-6" />
                            )}
                            Save All to Drive
                        </button>
                    </div>
                )}

                {/* Image Preview Modal */}
                {previewImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
                        <div className="relative max-w-4xl max-h-[90vh] w-full bg-slate-900 rounded-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors z-10"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <div className="flex-1 overflow-hidden bg-black flex items-center justify-center">
                                <img
                                    src={previewImage.url}
                                    alt="Preview"
                                    className="max-w-full max-h-[60vh] object-contain"
                                />
                            </div>
                            <div className="p-6 bg-slate-900 border-t border-slate-800">
                                <h3 className="text-sm font-medium text-slate-400 mb-2">Caption Preview</h3>
                                <p className="text-white whitespace-pre-wrap text-sm max-h-[20vh] overflow-y-auto">
                                    {previewImage.caption || "No caption provided."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}
