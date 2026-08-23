import React, { useState } from 'react';
import { Sparkles, Type, Palette, Sliders, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip, TooltipTrigger } from '../ui/Tooltip';
import { Slider } from '../ui/Slider';
import { Switch } from '../ui/Switch';
import { UI_CONTENT } from '../../config/uiContent';

const PRESET_COLORS = [
  '#FFFFFF', // White
  '#FFE600', // Yellow
  '#00F0FF', // Cyan
  '#FF007A', // Pink
  '#10B981', // Emerald
  '#FF7A00', // Orange
  '#6366F1', // Indigo
  '#000000', // Black
];

function ColorRow({ label, value, onChange }) {
  return (
    <div className="space-y-1 text-left px-4">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-[#A1A1AA]">{label}</label>
        <span className="font-mono text-[10px] text-indigo-400">{value}</span>
      </div>
      <div className="flex items-center gap-2">
        {/* Native Color Picker Box */}
        <div className="relative w-7 h-7 rounded-md overflow-hidden border border-[#2B2B32] shrink-0 cursor-pointer shadow-inner">
          <input
            type="color"
            value={value && value.startsWith('#') && value.length === 7 ? value : '#FFFFFF'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer opacity-0"
          />
          <div
            className="w-full h-full"
            style={{ backgroundColor: value || '#FFFFFF' }}
          />
        </div>

        {/* Quick color dots */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 shrink-0 cursor-pointer ${
                (value || '').toLowerCase() === c.toLowerCase()
                  ? 'border-indigo-500 ring-2 ring-indigo-500/40 scale-105'
                  : 'border-[#2B2B32]'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const PropertiesPanel = React.memo(function PropertiesPanel({
  style = {},
  onStyleChange,
  onApplyPreset,
}) {
  const [activeTab, setActiveTab] = useState('presets');
  const content = UI_CONTENT.stylePanel;

  return (
    <div className="w-72 2xl:w-80 h-full min-h-0 bg-[#18181B] p-1.5 text-white select-none overflow-hidden rounded-2xl border border-[#27272A]/80 shadow-2xl flex items-stretch shrink-0">
      {/* 1. LEFT SIDEBAR MENU */}
      <nav className="w-11 h-full bg-[#242428] flex flex-col items-center py-3 gap-2.5 shrink-0 rounded-[15px]">
        {/* Presets Tab */}
        <TooltipTrigger delay={100}>
          <Button
            type="button"
            onPress={() => setActiveTab('presets')}
            aria-label="Presets"
            className={`w-8 h-8 p-0 rounded-lg flex items-center justify-center transition-all ${
              activeTab === 'presets'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles size={16} />
          </Button>
          <Tooltip placement="left">Presets</Tooltip>
        </TooltipTrigger>

        {/* Font Tab */}
        <TooltipTrigger delay={100}>
          <Button
            type="button"
            onPress={() => setActiveTab('typography')}
            aria-label="Font Settings"
            className={`w-8 h-8 p-0 rounded-lg flex items-center justify-center transition-all ${
              activeTab === 'typography'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
            }`}
          >
            <Type size={16} />
          </Button>
          <Tooltip placement="left">Font</Tooltip>
        </TooltipTrigger>

        {/* Colors Tab */}
        <TooltipTrigger delay={100}>
          <Button
            type="button"
            onPress={() => setActiveTab('colors')}
            aria-label="Color Settings"
            className={`w-8 h-8 p-0 rounded-lg flex items-center justify-center transition-all ${
              activeTab === 'colors'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
            }`}
          >
            <Palette size={16} />
          </Button>
          <Tooltip placement="left">Colors</Tooltip>
        </TooltipTrigger>

        {/* Effects Tab */}
        <TooltipTrigger delay={100}>
          <Button
            type="button"
            onPress={() => setActiveTab('effects')}
            aria-label="Effects Settings"
            className={`w-8 h-8 p-0 rounded-lg flex items-center justify-center transition-all ${
              activeTab === 'effects'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders size={16} />
          </Button>
          <Tooltip placement="left">Effects</Tooltip>
        </TooltipTrigger>
      </nav>

      {/* 2. MAIN PROPERTIES CONTENT AREA */}
      <section className="flex-1 h-full flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-11 px-3 flex items-center shrink-0 gap-2.5 text-left">
          <h2 className="text-sm font-bold text-white tracking-tight shrink-0 capitalize">
            {activeTab}
          </h2>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-4 space-y-4 [&_.react-aria-Label]:text-[11px] [&_.react-aria-SliderOutput]:text-[11px]">
          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="px-4 space-y-3">
              <label className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block text-left">
                {content.presetsSectionTitle}
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                {content.presets.map((preset) => {
                  const isSelected = style.presetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => onApplyPreset?.(preset.id)}
                      className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/5 shadow-sm'
                          : 'border-[#27272A] bg-[#242428]/40 hover:border-[#3f3f46] hover:bg-[#242428]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-white">
                          {preset.name}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check size={10} />
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-[#A1A1AA] mb-1.5 leading-tight">
                        {preset.description}
                      </p>

                      {/* Visual Preview Badge */}
                      <div className="w-full py-2 px-3 rounded-lg bg-[#18181B] flex items-center justify-center border border-[#27272A]">
                        <span
                          className="font-bold text-[11px] tracking-wide"
                          style={{
                            fontFamily: preset.style.fontFamily || 'Montserrat',
                            color: preset.style.activeWordColor || '#FFE600',
                            textShadow: `1px 1px 0px ${preset.style.strokeColor || '#000'}`,
                          }}
                        >
                          {preset.previewText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TYPOGRAPHY */}
          {activeTab === 'typography' && (
            <div className="px-4 space-y-4 text-left">
              {/* Font Family Selection */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-[#A1A1AA]">
                  {content.fontFamilyLabel}
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {content.fontOptions.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => onStyleChange?.({ fontFamily: f.value })}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-left border transition-colors truncate cursor-pointer ${
                        style.fontFamily === f.value
                          ? 'border-indigo-500 bg-indigo-500/10 text-white'
                          : 'border-[#27272A] bg-[#242428]/40 text-[#A1A1AA] hover:text-white hover:bg-[#242428]'
                      }`}
                      style={{ fontFamily: f.value }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size Slider */}
              <div className="space-y-1">
                <Slider
                  label={content.fontSizeLabel}
                  minValue={20}
                  maxValue={72}
                  step={2}
                  value={style.fontSize || 38}
                  onChange={(val) => onStyleChange?.({ fontSize: val })}
                />
              </div>

              {/* Typography Toggles */}
              <div className="space-y-3 pt-3 border-t border-[#27272A] [&_.react-aria-Switch]:text-[11px] [&_.field-description]:text-[10px] [&_.field-description]:mt-0">
                <Switch
                  isSelected={style.uppercase}
                  onChange={(val) => onStyleChange?.({ uppercase: val })}
                  description={content.uppercaseDescription}
                >
                  {content.uppercaseLabel}
                </Switch>

                <Switch
                  isSelected={style.bold}
                  onChange={(val) => onStyleChange?.({ bold: val })}
                  description={content.boldDescription}
                >
                  {content.boldLabel}
                </Switch>

                <Switch
                  isSelected={style.italic}
                  onChange={(val) => onStyleChange?.({ italic: val })}
                >
                  {content.italicLabel}
                </Switch>
              </div>
            </div>
          )}

          {/* TAB 3: COLORS */}
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <ColorRow
                label={content.activeWordColorLabel}
                value={style.activeWordColor}
                onChange={(val) => onStyleChange?.({ activeWordColor: val })}
              />

              <ColorRow
                label={content.primaryTextColorLabel}
                value={style.textColor}
                onChange={(val) => onStyleChange?.({ textColor: val })}
              />

              <ColorRow
                label={content.strokeColorLabel}
                value={style.strokeColor}
                onChange={(val) => onStyleChange?.({ strokeColor: val })}
              />

              {/* Stroke Width Slider */}
              <div className="px-4 space-y-1">
                <Slider
                  label={content.strokeWidthLabel}
                  minValue={0}
                  maxValue={12}
                  step={1}
                  value={style.strokeWidth !== undefined ? style.strokeWidth : 4}
                  onChange={(val) => onStyleChange?.({ strokeWidth: val })}
                />
              </div>

              {/* Shadow Offset Slider */}
              <div className="px-4 space-y-1">
                <Slider
                  label={content.shadowDepthLabel}
                  minValue={0}
                  maxValue={10}
                  step={1}
                  value={style.shadowOffset !== undefined ? style.shadowOffset : 3}
                  onChange={(val) => onStyleChange?.({ shadowOffset: val })}
                />
              </div>
            </div>
          )}

          {/* TAB 4: EFFECTS */}
          {activeTab === 'effects' && (
            <div className="px-4 space-y-4 text-left">
              {/* Animation Style Selector */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-[#A1A1AA]">
                  {content.animationTypeLabel}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {content.animationOptions.map((anim) => (
                    <button
                      key={anim.id}
                      type="button"
                      onClick={() => onStyleChange?.({ animationType: anim.id })}
                      className={`px-2 py-1.5 rounded-md text-[11px] font-semibold border text-center transition-colors cursor-pointer ${
                        style.animationType === anim.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold'
                          : 'border-[#27272A] bg-[#242428]/40 text-[#A1A1AA] hover:text-white hover:bg-[#242428]'
                      }`}
                    >
                      {anim.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vertical Position Slider */}
              <div className="space-y-1">
                <Slider
                  label={content.verticalPositionLabel}
                  minValue={15}
                  maxValue={90}
                  step={1}
                  value={style.positionY || 78}
                  onChange={(val) => onStyleChange?.({ positionY: val })}
                />
              </div>

              {/* Background Box Highlight Toggles */}
              <div className="pt-3 border-t border-[#27272A] space-y-3 [&_.react-aria-Switch]:text-[11px] [&_.field-description]:text-[10px] [&_.field-description]:mt-0">
                <Switch
                  isSelected={style.hasBox}
                  onChange={(val) => onStyleChange?.({ hasBox: val })}
                  description={content.backgroundBoxDescription}
                >
                  {content.backgroundBoxLabel}
                </Switch>

                {style.hasBox && (
                  <div className="p-2.5 bg-[#242428]/50 rounded-lg space-y-3 border border-[#27272A]">
                    {/* Native color picker for box background */}
                    <div className="space-y-1 text-left">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-[#A1A1AA]">{content.boxBgColorLabel}</label>
                        <span className="font-mono text-[10px] text-indigo-400">{style.boxBackground}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#2B2B32] shrink-0 cursor-pointer shadow-inner">
                          <input
                            type="color"
                            value={
                              style.boxBackground && style.boxBackground.startsWith('#') && style.boxBackground.length === 7
                                ? style.boxBackground
                                : '#000000'
                            }
                            onChange={(e) => onStyleChange?.({ boxBackground: e.target.value })}
                            className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer opacity-0"
                          />
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: style.boxBackground || '#000000' }}
                          />
                        </div>
                        {/* Opacity control for box background */}
                        <div className="flex-1 min-w-0">
                          <Slider
                            label="Box Opacity"
                            minValue={10}
                            maxValue={100}
                            step={5}
                            value={
                              style.boxBackground && style.boxBackground.startsWith('rgba')
                                ? Math.round(parseFloat(style.boxBackground.split(',')[3]) * 100)
                                : 100
                            }
                            onChange={(opacityVal) => {
                              // If it's hex, convert to rgba
                              let color = style.boxBackground || '#000000';
                              let r = 0, g = 0, b = 0;
                              if (color.startsWith('#')) {
                                const hex = color.replace('#', '');
                                r = parseInt(hex.substring(0, 2), 16);
                                g = parseInt(hex.substring(2, 4), 16);
                                b = parseInt(hex.substring(4, 6), 16);
                              } else if (color.startsWith('rgba')) {
                                const parts = color.match(/[\d.]+/g);
                                r = parseInt(parts[0]);
                                g = parseInt(parts[1]);
                                b = parseInt(parts[2]);
                              } else if (color.startsWith('rgb')) {
                                const parts = color.match(/\d+/g);
                                r = parseInt(parts[0]);
                                g = parseInt(parts[1]);
                                b = parseInt(parts[2]);
                              }
                              onStyleChange?.({ boxBackground: `rgba(${r}, ${g}, ${b}, ${opacityVal / 100})` });
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Slider
                        label={content.boxCornerRadiusLabel}
                        minValue={4}
                        maxValue={24}
                        step={1}
                        value={style.boxRadius || 12}
                        onChange={(val) => onStyleChange?.({ boxRadius: val })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
});
