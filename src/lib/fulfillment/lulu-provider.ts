import {
  calculatePrintCost,
} from "@/lib/lulu/cost-calculator";
import { validateFile } from "@/lib/lulu/file-validator";
import {
  createPrintJob,
  getPrintJobStatus,
  cancelPrintJob,
} from "@/lib/lulu/print-jobs";
import type {
  FulfillmentProvider,
  PrintSpecs,
  CostEstimate,
  FileValidationResult,
  FulfillmentOrder,
  FulfillmentResult,
  OrderStatus,
} from "./index";

export class LuluFulfillmentProvider implements FulfillmentProvider {
  async calculateCost(specs: PrintSpecs): Promise<CostEstimate> {
    return calculatePrintCost(specs);
  }

  async validateFiles(files: {
    coverUrl: string;
    interiorUrl: string;
  }): Promise<FileValidationResult> {
    const [coverResult, interiorResult] = await Promise.all([
      validateFile(files.coverUrl, "cover"),
      validateFile(files.interiorUrl, "interior"),
    ]);

    return {
      valid: coverResult.valid && interiorResult.valid,
      errors: [...coverResult.errors, ...interiorResult.errors],
      warnings: [...coverResult.warnings, ...interiorResult.warnings],
    };
  }

  async createOrder(order: FulfillmentOrder): Promise<FulfillmentResult> {
    const result = await createPrintJob({
      external_id: order.externalId,
      line_items: [
        {
          title: order.title,
          cover: order.coverFileUrl,
          interior: order.interiorFileUrl,
          pod_package_id: order.podPackageId,
          quantity: order.quantity,
        },
      ],
      shipping_address: {
        name: order.shippingAddress.name,
        street1: order.shippingAddress.street1,
        street2: order.shippingAddress.street2,
        city: order.shippingAddress.city,
        state_code: order.shippingAddress.stateCode,
        country_code: order.shippingAddress.countryCode,
        postcode: order.shippingAddress.postcode,
        phone_number: order.shippingAddress.phoneNumber,
      },
      shipping_level: order.shippingLevel,
      contact_email: order.contactEmail,
    });

    return {
      providerId: "lulu",
      providerOrderId: String(result.id),
      status: result.status.name,
    };
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    const job = await getPrintJobStatus(parseInt(orderId));

    return {
      status: job.status.name,
      trackingId: job.line_items[0]?.tracking_id,
      trackingUrls: job.line_items[0]?.tracking_urls,
      messages: job.status.messages?.map((m) => m.message),
    };
  }

  async cancelOrder(orderId: string): Promise<void> {
    await cancelPrintJob(parseInt(orderId));
  }
}

// Singleton
export const luluProvider = new LuluFulfillmentProvider();
