// Lulu API type definitions

export interface LuluTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface PrintSpecs {
  trimSize: string; // e.g. "6x9"
  bindingType: string; // e.g. "perfect_bound"
  paperType: string; // e.g. "cream"
  interiorColor: string; // e.g. "bw"
  printQuality?: string; // e.g. "standard"
  coverFinish?: string; // e.g. "glossy"
  pageCount: number;
}

export interface CostEstimate {
  printingCostCents: number;
  shippingEstimateCents: number;
  currency: string;
}

export interface FileValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface LuluPrintJobRequest {
  external_id?: string;
  line_items: LuluLineItem[];
  shipping_address: LuluShippingAddress;
  shipping_level: string;
  contact_email: string;
}

export interface LuluLineItem {
  title: string;
  cover: string; // URL to cover PDF
  interior: string; // URL to interior PDF
  pod_package_id: string; // 27-char Lulu SKU
  quantity: number;
}

export interface LuluShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state_code?: string;
  country_code: string;
  postcode: string;
  phone_number?: string;
}

export interface LuluPrintJobResponse {
  id: number;
  status: {
    name: string;
    messages?: Array<{ message: string }>;
  };
  line_items: Array<{
    id: number;
    tracking_id?: string;
    tracking_urls?: string[];
  }>;
}

export interface LuluCostCalculationRequest {
  line_items: Array<{
    pod_package_id: string;
    page_count: number;
    quantity: number;
  }>;
  shipping_address: {
    country_code: string;
    state_code?: string;
    postcode?: string;
  };
  shipping_level: string;
}

export interface LuluCostCalculationResponse {
  total_cost_excl_tax: string;
  total_tax: string;
  total_cost_incl_tax: string;
  line_item_costs: Array<{
    cost_excl_tax: string;
    tax_amount: string;
    total_cost_incl_tax: string;
  }>;
  shipping_cost: {
    total_cost_excl_tax: string;
    total_tax: string;
    total_cost_incl_tax: string;
  };
  currency: string;
}
