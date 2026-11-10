import type * as React from 'react';
export interface ReportHeaderProps { title: React.ReactNode; subtitle?: React.ReactNode; logoSrc?: string; logoAlt?: string; className?: string }
export declare function ReportHeader(props: ReportHeaderProps): React.ReactElement;
export interface SectionTitleProps { number?: string; title: React.ReactNode; lead?: React.ReactNode; className?: string }
export declare function SectionTitle(props: SectionTitleProps): React.ReactElement;
export interface CompareRow { label: string; value: number; display?: React.ReactNode; series?: 'ty' | 'ly' | 's3' }
export interface KpiCardProps { label: React.ReactNode; value: React.ReactNode; delta?: React.ReactNode; tone?: 'neutral' | 'positive' | 'attention'; note?: React.ReactNode; compare?: CompareRow[]; className?: string }
export declare function KpiCard(props: KpiCardProps): React.ReactElement;
export interface PillProps { tone?: 'neutral' | 'positive' | 'attention' | 'brand'; children?: React.ReactNode; className?: string }
export declare function Pill(props: PillProps): React.ReactElement;
export interface CompareBarsProps { rows: CompareRow[]; max?: number; className?: string }
export declare function CompareBars(props: CompareBarsProps): React.ReactElement;
export interface DataTableColumn { key: string; label: React.ReactNode; align?: 'left' | 'right' }
export interface DataTableProps { columns: DataTableColumn[]; rows: Array<Record<string, React.ReactNode> & { total?: boolean }>; className?: string }
export declare function DataTable(props: DataTableProps): React.ReactElement;
export interface CalloutProps { tone?: 'positive' | 'attention'; title: React.ReactNode; items?: React.ReactNode[]; children?: React.ReactNode; className?: string }
export declare function Callout(props: CalloutProps): React.ReactElement;
export interface BrandFrameProps { label?: React.ReactNode; footer?: React.ReactNode; children?: React.ReactNode; className?: string }
export declare function BrandFrame(props: BrandFrameProps): React.ReactElement;
declare global { interface Window { Marlin: { ReportHeader: typeof ReportHeader; SectionTitle: typeof SectionTitle; KpiCard: typeof KpiCard; Pill: typeof Pill; CompareBars: typeof CompareBars; DataTable: typeof DataTable; Callout: typeof Callout; BrandFrame: typeof BrandFrame } } }
