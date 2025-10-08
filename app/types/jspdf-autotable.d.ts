declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface UserOptions {
    head?: (string | number)[][];
    body?: (string | number)[][];
    foot?: (string | number)[][];
    startY?: number;
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    pageBreak?: 'auto' | 'avoid' | 'always';
    rowPageBreak?: 'auto' | 'avoid';
    tableWidth?: 'auto' | 'wrap' | number;
    showHead?: 'everyPage' | 'firstPage' | 'never';
    showFoot?: 'everyPage' | 'lastPage' | 'never';
    tableLineColor?: string | number | number[];
    tableLineWidth?: number;
    theme?: 'striped' | 'grid' | 'plain';
    styles?: {
      cellPadding?: number;
      fontSize?: number;
      font?: string;
      fontStyle?: string;
      textColor?: string | number | number[];
      fillColor?: string | number | number[];
      lineColor?: string | number | number[];
      lineWidth?: number;
      halign?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
    };
    headStyles?: {
      cellPadding?: number;
      fontSize?: number;
      font?: string;
      fontStyle?: string;
      textColor?: string | number | number[];
      fillColor?: string | number | number[];
      lineColor?: string | number | number[];
      lineWidth?: number;
      halign?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
    };
    bodyStyles?: {
      cellPadding?: number;
      fontSize?: number;
      font?: string;
      fontStyle?: string;
      textColor?: string | number | number[];
      fillColor?: string | number | number[];
      lineColor?: string | number | number[];
      lineWidth?: number;
      halign?: 'left' | 'center' | 'right';
      valign?: 'top' | 'middle' | 'bottom';
    };
    columnStyles?: {
      [key: string]: {
        cellPadding?: number;
        fontSize?: number;
        font?: string;
        fontStyle?: string;
        textColor?: string | number | number[];
        fillColor?: string | number | number[];
        lineColor?: string | number | number[];
        lineWidth?: number;
        halign?: 'left' | 'center' | 'right';
        valign?: 'top' | 'middle' | 'bottom';
        cellWidth?: number | 'auto' | 'wrap';
      };
    };
  }

  function autoTable(doc: jsPDF, options: UserOptions): void;
  
  export default autoTable;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: import('jspdf-autotable').UserOptions) => void;
    lastAutoTable: {
      finalY: number;
    };
  }
}
