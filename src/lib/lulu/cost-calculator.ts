import { luluFetch } from "./client";
import { findPodPackageId } from "./pod-packages";
import type {
  PrintSpecs,
  CostEstimate,
  LuluCostCalculationResponse,
} from "./types";

export async function calculatePrintCost(
  specs: PrintSpecs,
  shippingCountry: string = "US"
): Promise<CostEstimate> {
  const podPackageId = await findPodPackageId({
    trimSize: specs.trimSize,
    bindingType: specs.bindingType,
    paperType: specs.paperType,
    interiorColor: specs.interiorColor,
    coverFinish: specs.coverFinish,
    printQuality: specs.printQuality,
  });

  if (!podPackageId) {
    throw new Error("Invalid print specs — could not determine Pod Package ID");
  }

  const res = await luluFetch("/print-job-cost-calculations/", {
    method: "POST",
    body: JSON.stringify({
      line_items: [
        {
          pod_package_id: podPackageId,
          page_count: specs.pageCount,
          quantity: 1,
        },
      ],
      shipping_address: {
        country_code: shippingCountry,
      },
      shipping_level: "MAIL",
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Lulu cost calculation failed: ${error}`);
  }

  const data: LuluCostCalculationResponse = await res.json();

  const printingCost = parseFloat(data.line_item_costs[0]?.cost_excl_tax || "0");
  const shippingCost = parseFloat(data.shipping_cost?.total_cost_excl_tax || "0");

  return {
    printingCostCents: Math.round(printingCost * 100),
    shippingEstimateCents: Math.round(shippingCost * 100),
    currency: data.currency || "USD",
  };
}
