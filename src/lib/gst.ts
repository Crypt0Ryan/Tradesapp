/** Australian GST rate (10%), applied to materials and labour. */
export const GST_RATE = 0.1;

export function gstAmount(exGstAmount: number): number {
  return exGstAmount * GST_RATE;
}

export function incGstAmount(exGstAmount: number): number {
  return exGstAmount * (1 + GST_RATE);
}
