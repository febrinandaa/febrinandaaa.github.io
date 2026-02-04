'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFanpageById } from '@/lib/config';
import { Upload, Loader2, Send, Trash2, X, GripVertical, Images, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import SidebarLayout from '@/components/SidebarLayout';

interface MultiPhotoItem {
    id: string;
    file: File;
    preview: string;
    caption: string;
}

interface ContentGroup {
    id: string;
    title: string;
    main_caption: string;
    image_count: number;
    status: string;
    created_at: string;
}

const MAX_IMAGES = 10;

export default function MultiPhotoPage() {
    const params = useParams();
    const router = useRouter();
    const pageId = params.pageId as string;
    const fanpage = getFanpageById(pageId);

    const [title, setTitle] = useState('');
    const [mainCaption, setMainCaption] = useState('');
    const [items, setItems] = useState<MultiPhotoItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [groups, setGroups] = useState<ContentGroup[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch existing groups
    useEffect(() => {
        if (pageId) {
            fetchGroups();
        }
    }, [pageId]);

    const fetchGroups = async () => {
        try {
            const res = await fetch(`/api/content/group?page_id=${pageId}`);
            const data = await res.json();
            if (data.groups) {
                setGroups(data.groups);
            }
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        }
    };

    // Check if page is enabled for multi-photo
    if (pageId !== 'FP_9') {
        return (
            <SidebarLayout>
                <div className="min-h-screen flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <Images className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Multi-Photo Belum Tersedia
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            Fitur multi-photo saat ini hanya tersedia untuk fanpage <strong>Inspirasi Bunda</strong>.
                        </p>
                        <Link
                            href="/content/FP_9/multi-photo"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
                        >
                            <Images className="w-5 h-5" />
                            Ke Inspirasi Bunda
                        </Link>
                    </div>
                </div>
            </SidebarLayout>
        );
    }

    if (!fanpage) {
        return (
            <SidebarLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-slate-500">Fanpage not found</p>
                </div>
            </SidebarLayout>
        );
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const remaining = MAX_IMAGES - items.length;
        const validFiles = files.slice(0, remaining);

        const newItems: MultiPhotoItem[] = validFiles.map((file, index) => ({
            id: `${Date.now()}-${index}`,
            file,
            preview: URL.createObjectURL(file),
            caption: '',
        }));

        setItems(prev => [...prev, ...newItems]);
    };

    const updateCaption = (id: string, caption: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, caption } : item
        ));
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleCreateGroup = async () => {
        if (items.length < 2) {
            setMessage({ type: 'error', text: 'Minimal 2 gambar diperlukan' });
            return;
        }
        if (!title.trim()) {
            setMessage({ type: 'error', text: 'Judul tidak boleh kosong' });
            return;
        }

        setIsUploading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append('page_id', pageId);
            formData.append('title', title);
            formData.append('main_caption', mainCaption || title);

            items.forEach((item, index) => {
                formData.append(`image_${index}`, item.file);
                formData.append(`caption_${index}`, item.caption);
            });

            const res = await fetch('/api/content/group', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: `Berhasil upload ${data.contents.length} gambar!` });
                // Reset form
                setTitle('');
                setMainCaption('');
                setItems([]);
                fetchGroups();
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsUploading(false);
        }
    };

    const handlePostGroup = async (groupId: string) => {
        if (!confirm('Post grup ini ke Facebook sekarang?')) return;

        setIsPosting(true);
        setMessage(null);

        try {
            const res = await fetch('/api/content/group/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group_id: groupId }),
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: `Berhasil posting ${data.images_posted} gambar ke Facebook!` });
                fetchGroups();
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <SidebarLayout>
            <div className="p-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <div className="relative w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-pink-500 shadow-md">
                        {fanpage.fbPageId ? (
                            <Image
                                src={`https://graph.facebook.com/${fanpage.fbPageId}/picture?type=large`}
                                alt={fanpage.name}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        ) : (
                            <span className="text-xl font-bold">{pageId}</span>
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{fanpage.name}</h1>
                        <p className="text-pink-500 font-medium flex items-center gap-2">
                            <Images className="w-4 h-4" />
                            Multi-Photo Post
                        </p>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl ${message.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Create New Group */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-8">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-pink-500" />
                        Buat Multi-Photo Post Baru
                    </h2>

                    {/* Title Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Judul / Tema (contoh: "Resep Kue Lapis Super Legit")
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Masukkan judul..."
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-500"
                        />
                    </div>

                    {/* Main Caption */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Caption Utama (muncul di atas gambar)
                        </label>
                        <textarea
                            value={mainCaption}
                            onChange={(e) => setMainCaption(e.target.value)}
                            placeholder="Contoh: 🧁 Resep ada di setiap gambar ya bund 😊"
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 resize-none"
                        />
                    </div>

                    {/* Upload Area */}
                    <div className="mb-6">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-pink-300 dark:border-pink-500/50 rounded-xl cursor-pointer bg-pink-50/50 dark:bg-pink-500/5 hover:bg-pink-100/50 dark:hover:bg-pink-500/10 transition-colors">
                            <Upload className="w-8 h-8 text-pink-400 mb-2" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Klik untuk upload gambar ({items.length}/{MAX_IMAGES})
                            </p>
                            <input
                                type="file"
                                className="hidden"
                                multiple
                                accept="image/*"
                                onChange={handleFileSelect}
                                disabled={items.length >= MAX_IMAGES}
                            />
                        </label>
                    </div>

                    {/* Image Grid */}
                    {items.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {items.map((item, index) => (
                                <div key={item.id} className="relative bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                                    <div className="flex gap-3">
                                        {/* Image */}
                                        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                                src={item.preview}
                                                alt={`Image ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded">
                                                {index + 1}
                                            </div>
                                        </div>
                                        {/* Caption */}
                                        <div className="flex-1">
                                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                                                Caption Gambar {index + 1}
                                            </label>
                                            <textarea
                                                value={item.caption}
                                                onChange={(e) => updateCaption(item.id, e.target.value)}
                                                placeholder="Resep/keterangan untuk gambar ini..."
                                                rows={3}
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Create Button */}
                    <button
                        onClick={handleCreateGroup}
                        disabled={isUploading || items.length < 2 || !title.trim()}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Images className="w-5 h-5" />
                                Simpan Grup ({items.length} gambar)
                            </>
                        )}
                    </button>
                </div>

                {/* Pending Groups */}
                {groups.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Grup Siap Posting ({groups.length})
                        </h2>
                        <div className="space-y-4">
                            {groups.map((group) => (
                                <div key={group.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white">{group.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {group.image_count} gambar • {new Date(group.created_at).toLocaleDateString('id-ID')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handlePostGroup(group.id)}
                                        disabled={isPosting}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {isPosting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                        Post ke FB
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}
