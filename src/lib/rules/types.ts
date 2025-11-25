export interface RulePreview {
  text: string;
  imageUrl?: string;
  productName: string;
}

export interface RulePreviewPayload {
  promptTemplate: string;
  ruleName?: string;
  platform?: string;
  scheduleTime?: string;
  frequency?: string;
  status?: string;
  productIds?: string[];
  ruleId?: string; // Thêm ruleId để lưu preview vào database khi đang edit
}

