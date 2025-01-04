import { ChartType, IRemotePlotConfig } from '@/stores/datasets'

export const chartType = ChartType.Column

export const plotConfig: IRemotePlotConfig = {
  data: [
    { productType: 'crossbody', totalCustomers: 153647, averageTotalCompletedOrdersEver: 1.9862 },
    { productType: 'clutch', totalCustomers: 75671, averageTotalCompletedOrdersEver: 1.9785 },
    { productType: 'sling', totalCustomers: 65251, averageTotalCompletedOrdersEver: 1.988 },
    { productType: 'bucket', totalCustomers: 32579, averageTotalCompletedOrdersEver: 1.9917 },
  ],
  xField: 'productType',
  yField: 'averageTotalCompletedOrdersEver',
  seriesField: null,
  meta: {
    averageTotalCompletedOrdersEver: { alias: 'Average Total Completed Orders Ever', narratorFormat: 'number' },
    productType: { alias: 'Product Type', narratorFormat: 'string' },
  },
  columnStyle: { radius: [10, 10, 0, 0] },
  tooltip: { shared: false },
  label: {
    position: 'top',
    formatField: 'averageTotalCompletedOrdersEver',
    layout: [{ type: 'interval-adjust-position' }, { type: 'interval-hide-overlap' }, { type: 'adjust-color' }],
  },
  smooth: true,
  color: '#6FB6EA',
  title: {
    text: 'Average Total Completed Orders Ever by Product Type',
    visible: true,
    style: { fontSize: 14, fill: '#0A0519' },
  },
  yAxis: {
    grid: { line: { style: { color: '#E4E3E8', lineDash: [7, 7], opacity: 0.7 } } },
    title: { text: 'Average Total Completed Orders Ever', style: { fontSize: 12, fill: '#000000A6' } },
    connectNulls: false,
  },
  xAxis: {
    label: { style: { fontSize: 12, fill: '#9B9A9E' } },
    tickLine: null,
    line: null,
    title: { text: 'Product Type', style: { fontSize: 12, fill: '#000000A6' } },
  },
  interactions: [
    { type: 'active-region' },
    { type: 'element-active' },
    { type: 'legend-highlight' },
    { type: 'element-selected' },
  ],
  annotations: [
    { type: 'line', start: ['min', 1.9861], end: ['max', 1.9861], style: { stroke: '#873bf4', lineDash: [2, 2] } },
    {
      type: 'dataMarker',
      position: ['max', 1.9861],
      text: { content: 'Average: 1.99', style: { fill: '#873bf4', fontSize: 12 } },
      point: { style: { opacity: 0 } },
      line: { style: { opacity: 0 } },
    },
  ],
}

export const plotConfigNoData: IRemotePlotConfig = {
  data: [],
  xField: 'productType',
  yField: 'averageTotalCompletedOrdersEver',
  seriesField: null,
  meta: {
    averageTotalCompletedOrdersEver: { alias: 'Average Total Completed Orders Ever', narratorFormat: 'number' },
    productType: { alias: 'Product Type', narratorFormat: 'string' },
  },
  columnStyle: { radius: [10, 10, 0, 0] },
  tooltip: { shared: false },
  label: {
    position: 'top',
    formatField: 'averageTotalCompletedOrdersEver',
    layout: [{ type: 'interval-adjust-position' }, { type: 'interval-hide-overlap' }, { type: 'adjust-color' }],
  },
  smooth: true,
  color: '#6FB6EA',
  title: {
    text: 'Average Total Completed Orders Ever by Product Type',
    visible: true,
    style: { fontSize: 14, fill: '#0A0519' },
  },
  yAxis: {
    grid: { line: { style: { color: '#E4E3E8', lineDash: [7, 7], opacity: 0.7 } } },
    title: { text: 'Average Total Completed Orders Ever', style: { fontSize: 12, fill: '#000000A6' } },
    connectNulls: false,
  },
  xAxis: {
    label: { style: { fontSize: 12, fill: '#9B9A9E' } },
    tickLine: null,
    line: null,
    title: { text: 'Product Type', style: { fontSize: 12, fill: '#000000A6' } },
  },
  interactions: [
    { type: 'active-region' },
    { type: 'element-active' },
    { type: 'legend-highlight' },
    { type: 'element-selected' },
  ],
  annotations: [
    { type: 'line', start: ['min', 1.9861], end: ['max', 1.9861], style: { stroke: '#873bf4', lineDash: [2, 2] } },
    {
      type: 'dataMarker',
      position: ['max', 1.9861],
      text: { content: 'Average: 1.99', style: { fill: '#873bf4', fontSize: 12 } },
      point: { style: { opacity: 0 } },
      line: { style: { opacity: 0 } },
    },
  ],
}
