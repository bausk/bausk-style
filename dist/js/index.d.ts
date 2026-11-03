// bausk-style 0.2.1 · generated, do not edit.
export type Scheme = 'light' | 'dark';
export type TokenName = 'bg' | 'bg-subtle' | 'bg-inverse' | 'fg' | 'fg-muted' | 'fg-subtle' | 'fg-inverse' | 'line' | 'line-strong' | 'accent' | 'accent-strong' | 'accent-subtle' | 'on-accent' | 'focus' | 'selection' | 'positive' | 'negative' | 'caution' | 'viz-1' | 'viz-2' | 'viz-3' | 'viz-4' | 'viz-5' | 'viz-6' | 'viz-up' | 'viz-down' | 'viz-muted' | 'viz-grid' | 'viz-axis' | 'viz-label' | 'font-text' | 'font-ui' | 'font-display' | 'font-mono' | 'size-2xs' | 'size-xs' | 'size-sm' | 'size-md' | 'size-text' | 'size-lg' | 'size-xl' | 'size-2xl' | 'size-3xl' | 'size-4xl' | 'leading-text' | 'leading-ui' | 'leading-tight' | 'weight-regular' | 'weight-medium' | 'weight-bold' | 'weight-display' | 'tracking-display' | 'tracking-label' | 'label-case' | 'label-stretch' | 'label-weight' | 'display-stretch' | 'ui-stretch' | 'space-1' | 'space-2' | 'space-3' | 'space-4' | 'space-5' | 'space-6' | 'space-7' | 'space-8' | 'measure-text' | 'measure-wide' | 'measure-page' | 'gutter' | 'row-h' | 'control-h' | 'radius' | 'radius-control' | 'line-w' | 'line-w-strong' | 'duration-fast' | 'duration-base' | 'duration-slow' | 'ease-out' | 'ease-in-out' | 'slide-margin' | 'slide-title' | 'slide-lead' | 'slide-body' | 'slide-small' | 'slide-foot' | 'video-action-safe' | 'video-title-safe';
export type Tokens = Record<TokenName, string>;
export interface Look { id: string; name: { en: string; uk: string }; status: 'candidate' | 'released' | 'legacy' | 'deprecated'; reference: string; color: Record<Scheme, Record<string, string>>; values: Record<string, string>; media: Record<string, unknown>; fonts: Record<'text' | 'ui' | 'display' | 'mono', string>; }
export declare const version: string;
export declare const looks: Record<string, Look>;
export declare const brands: Record<string, { id: string; status: string; defaultLook: string | null; name: Record<string, string | null>; short: Record<string, string | null> }>;
export declare function defaultLook(brand?: string): string;
export declare function tokens(look?: string, scheme?: Scheme): Tokens;
export declare function readTokens(el?: Element): Partial<Tokens>;
export declare function cssVar(name: TokenName): string;
export declare function toInt(hex: string): number;
export declare function vizSeries(t: Tokens): string[];
export declare function lightweightChartsOptions(t: Tokens): Record<string, unknown>;
export declare function candleColors(t: Tokens): Record<string, string>;
