// Fulfillment provider abstraction
// Designed for Lulu now, extensible for offset printing later

export interface PrintSpecs {
  trimSize: string;
  bindingType: string;
  paperType: string;
  interiorColor: string;
  printQuality?: string;
  coverFinish?: string;
  pageCount: number;
}

export interface CostEstimate {
  printingCostCents: number;
  shippingEstimateCents: number;
  currency: string;
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FulfillmentOrder {
  externalId: string;
  title: string;
  coverFileUrl: string;
  interiorFileUrl: string;
  podPackageId: string;
  quantity: number;
  shippingAddress: ShippingAddress;
  shippingLevel: string;
  contactEmail: string;
}

export interface ShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  stateCode?: string;
  countryCode: string;
  postcode: string;
  phoneNumber?: string;
}

export interface FulfillmentResult {
  providerId: string;
  providerOrderId: string;
  status: string;
}

export interface OrderStatus {
  status: string;
  trackingId?: string;
  trackingUrls?: string[];
  messages?: string[];
}

export interface FulfillmentProvider {
  calculateCost(specs: PrintSpecs): Promise<CostEstimate>;
  validateFiles(files: {
    coverUrl: string;
    interiorUrl: string;
  }): Promise<FileValidationResult>;
  createOrder(order: FulfillmentOrder): Promise<FulfillmentResult>;
  getOrderStatus(orderId: string): Promise<OrderStatus>;
  cancelOrder(orderId: string): Promise<void>;
}
