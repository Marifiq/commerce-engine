'use client';

import { useState, useEffect } from 'react';
import { 
  Save, X, Image as ImageIcon, Type, Palette, Layout, 
  Upload, Eye, ChevronDown, ChevronUp, Move, Trash2,
  AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { resolveImageUrl } from '@/lib/utils/imageUtils';

export interface BannerConfig {
  // Layout
  layout?: 'full-width' | 'container' | 'sidebar';
  height?: number; // in pixels
  width?: number; // in pixels
  
  // Background
  backgroundType?: 'image' | 'gradient' | 'solid';
  backgroundImage?: string;
  backgroundColor?: string;
  gradientColors?: string[];
  gradientDirection?: string;
  
  // Text
  title?: {
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    position?: { x: number; y: number };
  };
  description?: {
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    position?: { x: number; y: number };
  };
  
  // Button
  button?: {
    text?: string;
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    padding?: string;
    borderRadius?: number;
    position?: { x: number; y: number };
    link?: string;
  };
  
  // General
  padding?: string;
  borderRadius?: number;
  opacity?: number;
}

interface BannerBuilderProps {
  banner?: {
    id?: number;
    title?: string;
    description?: string;
    image?: string;
    link?: string;
    position?: string;
    isActive?: boolean;
    order?: number;
    config?: BannerConfig | null;
  };
  onSave: (data: {
    title?: string;
    description?: string;
    image?: string;
    link?: string;
    position: string;
    isActive: boolean;
    order: number;
    config?: BannerConfig;
  }) => Promise<void>;
  onCancel?: () => void;
  saving?: boolean;
}

export default function BannerBuilder({ banner, onSave, onCancel, saving = false }: BannerBuilderProps) {
  const [activeTab, setActiveTab] = useState<'layout' | 'background' | 'text' | 'button' | 'preview'>('layout');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    layout: true,
    background: true,
    text: true,
    button: true,
  });

  // Form state
  const [title, setTitle] = useState(banner?.title || '');
  const [description, setDescription] = useState(banner?.description || '');
  const [link, setLink] = useState(banner?.link || '');
  const [position, setPosition] = useState(banner?.position || 'top');
  const [isActive, setIsActive] = useState(banner?.isActive !== false);
  const [order, setOrder] = useState(banner?.order || 0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Config state
  const [config, setConfig] = useState<BannerConfig>({
    layout: 'full-width',
    height: 200,
    backgroundType: 'gradient',
    backgroundColor: '#3B82F6',
    gradientColors: ['#3B82F6', '#8B5CF6'],
    gradientDirection: 'to right',
    title: {
      text: 'Special Offer',
      fontSize: 32,
      fontFamily: 'system-ui',
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
      position: { x: 50, y: 30 },
    },
    description: {
      text: 'Get up to 50% off on selected items',
      fontSize: 18,
      fontFamily: 'system-ui',
      fontWeight: 'normal',
      color: '#FFFFFF',
      textAlign: 'center',
      position: { x: 50, y: 60 },
    },
    button: {
      text: 'Shop Now',
      backgroundColor: '#FFFFFF',
      textColor: '#3B82F6',
      fontSize: 16,
      padding: '12px 24px',
      borderRadius: 8,
      position: { x: 50, y: 85 },
      link: '#',
    },
    padding: '20px',
    borderRadius: 0,
    opacity: 100,
    ...(banner?.config as BannerConfig || {}),
  });

  useEffect(() => {
    if (banner?.image) {
      setImagePreview(resolveImageUrl(banner.image));
    }
  }, [banner]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateConfig = (path: string, value: any) => {
    setConfig(prev => {
      const keys = path.split('.');
      const newConfig = { ...prev };
      let current: any = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const getConfigValue = (path: string): any => {
    const keys = path.split('.');
    let current: any = config;
    for (const key of keys) {
      if (current[key] === undefined) return undefined;
      current = current[key];
    }
    return current;
  };

  const handleSave = async () => {
    let imageData = imagePreview || banner?.image;
    
    if (imageFile) {
      imageData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
    }

    await onSave({
      title,
      description,
      image: imageData,
      link,
      position,
      isActive,
      order,
      config,
    });
  };

  // Generate CSS for preview
  const getBackgroundStyle = (): React.CSSProperties => {
    if (config.backgroundType === 'image' && imagePreview) {
      return {
        backgroundImage: `url(${imagePreview})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    } else if (config.backgroundType === 'gradient' && config.gradientColors) {
      const direction = config.gradientDirection || 'to right';
      return {
        background: `linear-gradient(${direction}, ${config.gradientColors.join(', ')})`,
      };
    } else {
      return {
        backgroundColor: config.backgroundColor || '#3B82F6',
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {[
          { id: 'layout', label: 'Layout', icon: Layout },
          { id: 'background', label: 'Background', icon: ImageIcon },
          { id: 'text', label: 'Text', icon: Type },
          { id: 'button', label: 'Button', icon: Move },
          { id: 'preview', label: 'Preview', icon: Eye },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 font-bold transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-black dark:border-white text-black dark:text-white'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4 text-black dark:text-white">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  placeholder="Banner title"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  rows={3}
                  placeholder="Banner description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                    Position
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  >
                    <option value="top">Top</option>
                    <option value="middle">Middle</option>
                    <option value="bottom">Bottom</option>
                    <option value="sidebar">Sidebar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                    Order
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                  Link (optional)
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4"
                />
                <label className="text-sm font-bold text-zinc-900 dark:text-white">Active</label>
              </div>
            </div>
          </div>

          {/* Layout Tab */}
          {activeTab === 'layout' && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-black dark:text-white">Layout Settings</h3>
                <button
                  onClick={() => toggleSection('layout')}
                  className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {expandedSections.layout ? <ChevronUp /> : <ChevronDown />}
                </button>
              </div>
              {expandedSections.layout && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                      Layout Type
                    </label>
                    <select
                      value={config.layout || 'full-width'}
                      onChange={(e) => updateConfig('layout', e.target.value)}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    >
                      <option value="full-width">Full Width</option>
                      <option value="container">Container</option>
                      <option value="sidebar">Sidebar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      value={config.height || 200}
                      onChange={(e) => updateConfig('height', parseInt(e.target.value) || 200)}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                      Padding
                    </label>
                    <input
                      type="text"
                      value={config.padding || '20px'}
                      onChange={(e) => updateConfig('padding', e.target.value)}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      placeholder="20px"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                      Border Radius (px)
                    </label>
                    <input
                      type="number"
                      value={config.borderRadius || 0}
                      onChange={(e) => updateConfig('borderRadius', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Background Tab */}
          {activeTab === 'background' && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-black dark:text-white">Background Settings</h3>
                <button
                  onClick={() => toggleSection('background')}
                  className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {expandedSections.background ? <ChevronUp /> : <ChevronDown />}
                </button>
              </div>
              {expandedSections.background && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                      Background Type
                    </label>
                    <select
                      value={config.backgroundType || 'gradient'}
                      onChange={(e) => updateConfig('backgroundType', e.target.value)}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    >
                      <option value="image">Image</option>
                      <option value="gradient">Gradient</option>
                      <option value="solid">Solid Color</option>
                    </select>
                  </div>

                  {config.backgroundType === 'image' && (
                    <div>
                      <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                        Background Image
                      </label>
                      <label className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                        <Upload size={18} />
                        <span className="font-bold">Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="mt-2 w-full h-32 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
                        />
                      )}
                    </div>
                  )}

                  {config.backgroundType === 'gradient' && (
                    <>
                      <div>
                        <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                          Gradient Direction
                        </label>
                        <select
                          value={config.gradientDirection || 'to right'}
                          onChange={(e) => updateConfig('gradientDirection', e.target.value)}
                          className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        >
                          <option value="to right">To Right</option>
                          <option value="to left">To Left</option>
                          <option value="to bottom">To Bottom</option>
                          <option value="to top">To Top</option>
                          <option value="to bottom right">To Bottom Right</option>
                          <option value="to top left">To Top Left</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                            Color 1
                          </label>
                          <input
                            type="color"
                            value={config.gradientColors?.[0] || '#3B82F6'}
                            onChange={(e) => {
                              const colors = config.gradientColors || ['#3B82F6', '#8B5CF6'];
                              colors[0] = e.target.value;
                              updateConfig('gradientColors', colors);
                            }}
                            className="w-full h-10 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                            Color 2
                          </label>
                          <input
                            type="color"
                            value={config.gradientColors?.[1] || '#8B5CF6'}
                            onChange={(e) => {
                              const colors = config.gradientColors || ['#3B82F6', '#8B5CF6'];
                              colors[1] = e.target.value;
                              updateConfig('gradientColors', colors);
                            }}
                            className="w-full h-10 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {config.backgroundType === 'solid' && (
                    <div>
                      <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                        Background Color
                      </label>
                      <input
                        type="color"
                        value={config.backgroundColor || '#3B82F6'}
                        onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                        className="w-full h-10 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                      Opacity (%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.opacity || 100}
                      onChange={(e) => updateConfig('opacity', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-sm text-zinc-500 text-right">{config.opacity || 100}%</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text Tab */}
          {activeTab === 'text' && (
            <div className="space-y-6">
              {/* Title Settings */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-black dark:text-white">Title Settings</h3>
                  <button
                    onClick={() => toggleSection('text')}
                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    {expandedSections.text ? <ChevronUp /> : <ChevronDown />}
                  </button>
                </div>
                {expandedSections.text && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                        Font Size (px)
                      </label>
                      <input
                        type="number"
                        value={config.title?.fontSize || 32}
                        onChange={(e) => updateConfig('title.fontSize', parseInt(e.target.value) || 32)}
                        className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                        Font Weight
                      </label>
                      <select
                        value={config.title?.fontWeight || 'bold'}
                        onChange={(e) => updateConfig('title.fontWeight', e.target.value)}
                        className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="600">Semi-Bold</option>
                        <option value="800">Extra-Bold</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                        Text Color
                      </label>
                      <input
                        type="color"
                        value={config.title?.color || '#FFFFFF'}
                        onChange={(e) => updateConfig('title.color', e.target.value)}
                        className="w-full h-10 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                        Text Align
                      </label>
                      <div className="flex gap-2">
                        {(['left', 'center', 'right'] as const).map(align => (
                          <button
                            key={align}
                            onClick={() => updateConfig('title.textAlign', align)}
                            className={`flex-1 px-4 py-2 border rounded-lg font-bold transition-colors ${
                              config.title?.textAlign === align
                                ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                                : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            {align === 'left' && <AlignLeft className="inline" size={16} />}
                            {align === 'center' && <AlignCenter className="inline" size={16} />}
                            {align === 'right' && <AlignRight className="inline" size={16} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description Settings */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4 text-black dark:text-white">Description Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                      Font Size (px)
                    </label>
                    <input
                      type="number"
                      value={config.description?.fontSize || 18}
                      onChange={(e) => updateConfig('description.fontSize', parseInt(e.target.value) || 18)}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                      Font Weight
                    </label>
                    <select
                      value={config.description?.fontWeight || 'normal'}
                      onChange={(e) => updateConfig('description.fontWeight', e.target.value)}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="600">Semi-Bold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={config.description?.color || '#FFFFFF'}
                      onChange={(e) => updateConfig('description.color', e.target.value)}
                      className="w-full h-10 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                      Text Align
                    </label>
                    <div className="flex gap-2">
                      {(['left', 'center', 'right'] as const).map(align => (
                        <button
                          key={align}
                          onClick={() => updateConfig('description.textAlign', align)}
                          className={`flex-1 px-4 py-2 border rounded-lg font-bold transition-colors ${
                            config.description?.textAlign === align
                              ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                              : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          {align === 'left' && <AlignLeft className="inline" size={16} />}
                          {align === 'center' && <AlignCenter className="inline" size={16} />}
                          {align === 'right' && <AlignRight className="inline" size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Button Tab */}
          {activeTab === 'button' && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-black dark:text-white">Button Settings</h3>
                <button
                  onClick={() => toggleSection('button')}
                  className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {expandedSections.button ? <ChevronUp /> : <ChevronDown />}
                </button>
              </div>
              {expandedSections.button && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={config.button?.text || 'Shop Now'}
                      onChange={(e) => updateConfig('button.text', e.target.value)}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                      Button Link
                    </label>
                    <input
                      type="url"
                      value={config.button?.link || link}
                      onChange={(e) => {
                        updateConfig('button.link', e.target.value);
                        setLink(e.target.value);
                      }}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                        Background Color
                      </label>
                      <input
                        type="color"
                        value={config.button?.backgroundColor || '#FFFFFF'}
                        onChange={(e) => updateConfig('button.backgroundColor', e.target.value)}
                        className="w-full h-10 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                        Text Color
                      </label>
                      <input
                        type="color"
                        value={config.button?.textColor || '#3B82F6'}
                        onChange={(e) => updateConfig('button.textColor', e.target.value)}
                        className="w-full h-10 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                      Font Size (px)
                    </label>
                    <input
                      type="number"
                      value={config.button?.fontSize || 16}
                      onChange={(e) => updateConfig('button.fontSize', parseInt(e.target.value) || 16)}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                      Padding
                    </label>
                    <input
                      type="text"
                      value={config.button?.padding || '12px 24px'}
                      onChange={(e) => updateConfig('button.padding', e.target.value)}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      placeholder="12px 24px"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-zinc-900 dark:text-white">
                      Border Radius (px)
                    </label>
                    <input
                      type="number"
                      value={config.button?.borderRadius || 8}
                      onChange={(e) => updateConfig('button.borderRadius', parseInt(e.target.value) || 8)}
                      className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 sticky top-6">
            <h3 className="text-lg font-bold mb-4 text-black dark:text-white">Live Preview</h3>
            <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-950">
              <div
                style={{
                  ...getBackgroundStyle(),
                  height: `${config.height || 200}px`,
                  padding: config.padding || '20px',
                  borderRadius: `${config.borderRadius || 0}px`,
                  opacity: (config.opacity || 100) / 100,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: config.title?.textAlign === 'center' ? 'center' : config.title?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                  textAlign: config.title?.textAlign || 'center',
                }}
              >
                {title && (
                  <div
                    style={{
                      fontSize: `${config.title?.fontSize || 32}px`,
                      fontWeight: config.title?.fontWeight || 'bold',
                      color: config.title?.color || '#FFFFFF',
                      marginBottom: '10px',
                      textAlign: config.title?.textAlign || 'center',
                    }}
                  >
                    {title}
                  </div>
                )}
                {description && (
                  <div
                    style={{
                      fontSize: `${config.description?.fontSize || 18}px`,
                      fontWeight: config.description?.fontWeight || 'normal',
                      color: config.description?.color || '#FFFFFF',
                      marginBottom: '15px',
                      textAlign: config.description?.textAlign || 'center',
                    }}
                  >
                    {description}
                  </div>
                )}
                {config.button?.text && (
                  <a
                    href={config.button.link || link || '#'}
                    style={{
                      display: 'inline-block',
                      backgroundColor: config.button.backgroundColor || '#FFFFFF',
                      color: config.button.textColor || '#3B82F6',
                      fontSize: `${config.button.fontSize || 16}px`,
                      padding: config.button.padding || '12px 24px',
                      borderRadius: `${config.button.borderRadius || 8}px`,
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    {config.button.text}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Banner'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-6 py-3 border border-zinc-200 dark:border-zinc-700 rounded-lg font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

