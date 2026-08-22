import React, { useState } from 'react';
import {
  Palette,
  Type,
  Sparkles,
  Sliders,
  Check,
} from 'lucide-react';
import { Tabs, TabList, Tab, TabPanel } from '../ui/Tabs';
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
    <div className="space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-text-primary">{label}</label>
        <span className="font-mono text-[10px] text-text-secondary">{value}</span>
      </div>
      <div className="flex items-center gap-2">
        {/* Native Color Picker Box */}
        <div className="relative w-7 h-7 rounded-[6px] overflow-hidden border border-border shrink-0 cursor-pointer shadow-inner">
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
                  ? 'border-primary ring-2 ring-primary/40 scale-105'
                  : 'border-border'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const StyleStudio = ({ style, onStyleChange, onApplyPreset }) => {
  const content = UI_CONTENT.stylePanel;
  const [activeTab, setActiveTab] = useState('presets');

  return (
    <aside className="w-80 h-full bg-surface border-l border-border/80 flex flex-col select-none shrink-0">
      {/* Header */}
      <div className="p-3.5 border-b border-border/80">
        <h2 className="font-bold text-sm text-text-primary mb-2.5 flex items-center gap-2 text-left">
          <Palette size={15} className="text-text-secondary" />
          <span>{content.title}</span>
        </h2>

        <Tabs selectedKey={activeTab} onSelectionChange={setActiveTab}>
          <TabList aria-label="Style Studio Navigation" className="w-full justify-around bg-main border border-border">
            <Tab id="presets" className="flex items-center gap-1 text-[11px]">
              <Sparkles size={12} />
              <span>Presets</span>
            </Tab>
            <Tab id="typography" className="flex items-center gap-1 text-[11px]">
              <Type size={12} />
              <span>Font</span>
            </Tab>
            <Tab id="colors" className="flex items-center gap-1 text-[11px]">
              <Palette size={12} />
              <span>Colors</span>
            </Tab>
            <Tab id="effects" className="flex items-center gap-1 text-[11px]">
              <Sliders size={12} />
              <span>Effects</span>
            </Tab>
          </TabList>

          {/* Panel Scrollable Body */}
          <div className="overflow-y-auto max-h-[calc(100vh-14rem)] pr-1 custom-scrollbar mt-3">
            {/* TAB 1: PRESETS */}
            <TabPanel id="presets" className="space-y-3 mt-0">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block text-left">
                {content.presetsSectionTitle}
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                {content.presets.map((preset) => {
                  const isSelected = style.presetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => onApplyPreset(preset.id)}
                      className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-primary bg-surface-hover shadow-sm'
                          : 'border-border bg-main/40 hover:border-border-color hover:bg-main'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-text-primary">
                          {preset.name}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                            <Check size={10} />
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-text-secondary mb-2 leading-tight">
                        {preset.description}
                      </p>

                      {/* Visual Preview Badge */}
                      <div className="w-full py-1.5 px-3 rounded-[6px] bg-main flex items-center justify-center border border-border">
                        <span
                          className="font-bold text-xs tracking-wide"
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
            </TabPanel>

            {/* TAB 2: TYPOGRAPHY */}
            <TabPanel id="typography" className="space-y-4 mt-0 text-left">
              {/* Font Family */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-primary">
                  {content.fontFamilyLabel}
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {content.fontOptions.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => onStyleChange({ fontFamily: f.value })}
                      className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold text-left border transition-colors truncate cursor-pointer ${
                        style.fontFamily === f.value
                          ? 'border-primary bg-surface-hover text-text-primary'
                          : 'border-border bg-main text-text-secondary hover:text-text-primary'
                      }`}
                      style={{ fontFamily: f.value }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-1">
                <Slider
                  label={content.fontSizeLabel}
                  minValue={20}
                  maxValue={72}
                  step={2}
                  value={style.fontSize || 38}
                  onChange={(val) => onStyleChange({ fontSize: val })}
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t border-border">
                <Switch
                  isSelected={style.uppercase}
                  onChange={(val) => onStyleChange({ uppercase: val })}
                  description={content.uppercaseDescription}
                >
                  {content.uppercaseLabel}
                </Switch>

                <Switch
                  isSelected={style.bold}
                  onChange={(val) => onStyleChange({ bold: val })}
                  description={content.boldDescription}
                >
                  {content.boldLabel}
                </Switch>

                <Switch
                  isSelected={style.italic}
                  onChange={(val) => onStyleChange({ italic: val })}
                >
                  {content.italicLabel}
                </Switch>
              </div>
            </TabPanel>

            {/* TAB 3: COLORS */}
            <TabPanel id="colors" className="space-y-4 mt-0 text-left">
              <ColorRow
                label={content.activeWordColorLabel}
                value={style.activeWordColor}
                onChange={(val) => onStyleChange({ activeWordColor: val })}
              />

              <ColorRow
                label={content.primaryTextColorLabel}
                value={style.textColor}
                onChange={(val) => onStyleChange({ textColor: val })}
              />

              <ColorRow
                label={content.strokeColorLabel}
                value={style.strokeColor}
                onChange={(val) => onStyleChange({ strokeColor: val })}
              />

              {/* Stroke Width Slider */}
              <div className="space-y-1">
                <Slider
                  label={content.strokeWidthLabel}
                  minValue={0}
                  maxValue={12}
                  step={1}
                  value={style.strokeWidth !== undefined ? style.strokeWidth : 4}
                  onChange={(val) => onStyleChange({ strokeWidth: val })}
                />
              </div>

              {/* Shadow Offset Slider */}
              <div className="space-y-1">
                <Slider
                  label={content.shadowDepthLabel}
                  minValue={0}
                  maxValue={10}
                  step={1}
                  value={style.shadowOffset !== undefined ? style.shadowOffset : 3}
                  onChange={(val) => onStyleChange({ shadowOffset: val })}
                />
              </div>
            </TabPanel>

            {/* TAB 4: EFFECTS */}
            <TabPanel id="effects" className="space-y-4 mt-0 text-left">
              {/* Animation Style */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-text-primary">
                  {content.animationTypeLabel}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {content.animationOptions.map((anim) => (
                    <button
                      key={anim.id}
                      type="button"
                      onClick={() => onStyleChange({ animationType: anim.id })}
                      className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium border text-center transition-colors cursor-pointer ${
                        style.animationType === anim.id
                          ? 'border-primary bg-surface-hover text-text-primary font-bold'
                          : 'border-border bg-main text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {anim.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vertical Position */}
              <div className="space-y-1">
                <Slider
                  label={content.verticalPositionLabel}
                  minValue={15}
                  maxValue={90}
                  step={1}
                  value={style.positionY || 78}
                  onChange={(val) => onStyleChange({ positionY: val })}
                />
              </div>

              {/* Background Box Highlight */}
              <div className="pt-3 border-t border-border space-y-3">
                <Switch
                  isSelected={style.hasBox}
                  onChange={(val) => onStyleChange({ hasBox: val })}
                  description={content.backgroundBoxDescription}
                >
                  {content.backgroundBoxLabel}
                </Switch>

                {style.hasBox && (
                  <div className="p-3 bg-main rounded-[8px] space-y-3 border border-border">
                    <ColorRow
                      label={content.boxBgColorLabel}
                      value={style.boxBackground}
                      onChange={(val) => onStyleChange({ boxBackground: val })}
                    />
                    <div className="space-y-1">
                      <Slider
                        label={content.boxCornerRadiusLabel}
                        minValue={4}
                        maxValue={24}
                        step={1}
                        value={style.boxRadius || 12}
                        onChange={(val) => onStyleChange({ boxRadius: val })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabPanel>
          </div>
        </Tabs>
      </div>
    </aside>
  );
};
