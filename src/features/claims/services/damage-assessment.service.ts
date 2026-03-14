import { getOptionalOpenAiEnv } from "@/config/env";
import { getSignedPhotosForClaim } from "@/features/claims/services/claim-photos.service";

const maxAssessmentPhotos = 6;

const supportedVehicleAreas = [
  "front_bumper",
  "rear_bumper",
  "hood",
  "roof",
  "trunk",
  "left_fender",
  "right_fender",
  "left_front_door",
  "right_front_door",
  "left_rear_door",
  "right_rear_door",
  "left_quarter_panel",
  "right_quarter_panel",
  "windshield",
  "rear_window",
  "left_headlight",
  "right_headlight",
  "left_taillight",
  "right_taillight",
  "grille",
  "left_mirror",
  "right_mirror",
  "wheel",
  "tire",
  "underbody",
  "unknown",
] as const;

const supportedDamageTypes = [
  "scratch",
  "dent",
  "crack",
  "paint_transfer",
  "broken_part",
  "glass_damage",
  "misalignment",
  "other",
] as const;

const supportedSeverities = ["minor", "moderate", "severe"] as const;
const supportedRepairActions = ["refinish", "repair", "replace", "inspect"] as const;
const supportedConfidenceLevels = ["low", "medium", "high"] as const;

type VehicleArea = (typeof supportedVehicleAreas)[number];
type DamageType = (typeof supportedDamageTypes)[number];
type DamageSeverity = (typeof supportedSeverities)[number];
type RepairAction = (typeof supportedRepairActions)[number];
type ConfidenceLevel = (typeof supportedConfidenceLevels)[number];

export type DamageEstimateLineItem = {
  confidence: ConfidenceLevel;
  damageType: DamageType;
  estimatedCost: number;
  label: string;
  rationale: string;
  repairAction: RepairAction;
  severity: DamageSeverity;
  source: "ai_vision";
  vehicleArea: VehicleArea;
};

type DamageAssessmentOutput = {
  damage_items?: unknown;
  summary?: unknown;
};

type RawDamageAssessmentItem = {
  confidence?: unknown;
  damage_type?: unknown;
  rationale?: unknown;
  repair_action?: unknown;
  severity?: unknown;
  vehicle_area?: unknown;
};

type DamageAssessmentResult = {
  adjusterNotes: string;
  lineItems: DamageEstimateLineItem[];
  totalAmount: number;
};

type ClaimAssessmentContext = {
  claimId: string;
  description: string | null;
  refNumber: string | null;
  vehicleInfo: Record<string, unknown> | null;
};

const areaActionBaseCost: Record<VehicleArea, Record<RepairAction, number>> = {
  front_bumper: {
    inspect: 150,
    refinish: 325,
    repair: 700,
    replace: 1350,
  },
  grille: {
    inspect: 150,
    refinish: 220,
    repair: 340,
    replace: 650,
  },
  hood: {
    inspect: 175,
    refinish: 425,
    repair: 875,
    replace: 1650,
  },
  left_fender: {
    inspect: 150,
    refinish: 320,
    repair: 650,
    replace: 1325,
  },
  left_front_door: {
    inspect: 165,
    refinish: 360,
    repair: 760,
    replace: 1525,
  },
  left_headlight: {
    inspect: 140,
    refinish: 120,
    repair: 260,
    replace: 725,
  },
  left_mirror: {
    inspect: 125,
    refinish: 160,
    repair: 250,
    replace: 420,
  },
  left_quarter_panel: {
    inspect: 185,
    refinish: 420,
    repair: 925,
    replace: 2150,
  },
  left_rear_door: {
    inspect: 165,
    refinish: 360,
    repair: 760,
    replace: 1525,
  },
  left_taillight: {
    inspect: 140,
    refinish: 120,
    repair: 240,
    replace: 520,
  },
  rear_bumper: {
    inspect: 150,
    refinish: 325,
    repair: 700,
    replace: 1300,
  },
  rear_window: {
    inspect: 150,
    refinish: 120,
    repair: 240,
    replace: 775,
  },
  right_fender: {
    inspect: 150,
    refinish: 320,
    repair: 650,
    replace: 1325,
  },
  right_front_door: {
    inspect: 165,
    refinish: 360,
    repair: 760,
    replace: 1525,
  },
  right_headlight: {
    inspect: 140,
    refinish: 120,
    repair: 260,
    replace: 725,
  },
  right_mirror: {
    inspect: 125,
    refinish: 160,
    repair: 250,
    replace: 420,
  },
  right_quarter_panel: {
    inspect: 185,
    refinish: 420,
    repair: 925,
    replace: 2150,
  },
  right_rear_door: {
    inspect: 165,
    refinish: 360,
    repair: 760,
    replace: 1525,
  },
  right_taillight: {
    inspect: 140,
    refinish: 120,
    repair: 240,
    replace: 520,
  },
  roof: {
    inspect: 200,
    refinish: 460,
    repair: 980,
    replace: 1850,
  },
  tire: {
    inspect: 120,
    refinish: 80,
    repair: 180,
    replace: 280,
  },
  trunk: {
    inspect: 175,
    refinish: 400,
    repair: 820,
    replace: 1550,
  },
  underbody: {
    inspect: 280,
    refinish: 220,
    repair: 540,
    replace: 1100,
  },
  unknown: {
    inspect: 175,
    refinish: 260,
    repair: 540,
    replace: 1100,
  },
  wheel: {
    inspect: 140,
    refinish: 200,
    repair: 310,
    replace: 480,
  },
  windshield: {
    inspect: 160,
    refinish: 120,
    repair: 220,
    replace: 690,
  },
};

const severityMultiplier: Record<DamageSeverity, number> = {
  minor: 0.75,
  moderate: 1,
  severe: 1.4,
};

const damageTypeAdjustment: Record<DamageType, number> = {
  broken_part: 240,
  crack: 170,
  dent: 110,
  glass_damage: 260,
  misalignment: 190,
  other: 0,
  paint_transfer: -70,
  scratch: -40,
};

const confidenceAdjustment: Record<ConfidenceLevel, number> = {
  high: 40,
  low: -60,
  medium: 0,
};

const damageAssessmentSchema = {
  additionalProperties: false,
  properties: {
    summary: {
      type: "string",
    },
    damage_items: {
      items: {
        additionalProperties: false,
        properties: {
          vehicle_area: {
            enum: supportedVehicleAreas,
            type: "string",
          },
          damage_type: {
            enum: supportedDamageTypes,
            type: "string",
          },
          severity: {
            enum: supportedSeverities,
            type: "string",
          },
          repair_action: {
            enum: supportedRepairActions,
            type: "string",
          },
          confidence: {
            enum: supportedConfidenceLevels,
            type: "string",
          },
          rationale: {
            type: "string",
          },
        },
        required: ["vehicle_area", "damage_type", "severity", "repair_action", "confidence", "rationale"],
        type: "object",
      },
      type: "array",
    },
  },
  required: ["summary", "damage_items"],
  type: "object",
} as const;

function toSentenceCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function roundEstimateAmount(value: number) {
  return Math.max(100, Math.round(value / 25) * 25);
}

function extractVehicleSummary(vehicleInfo: Record<string, unknown> | null) {
  if (!vehicleInfo) {
    return "Vehicle details unavailable";
  }

  const year = typeof vehicleInfo.year === "string" || typeof vehicleInfo.year === "number" ? String(vehicleInfo.year) : "";
  const make = typeof vehicleInfo.make === "string" ? vehicleInfo.make.trim() : "";
  const model = typeof vehicleInfo.model === "string" ? vehicleInfo.model.trim() : "";

  return [year, make, model].filter(Boolean).join(" ") || "Vehicle details unavailable";
}

function calculateRepairCost(item: {
  confidence: ConfidenceLevel;
  damageType: DamageType;
  repairAction: RepairAction;
  severity: DamageSeverity;
  vehicleArea: VehicleArea;
}) {
  const baseCost = areaActionBaseCost[item.vehicleArea][item.repairAction];
  const adjusted =
    baseCost * severityMultiplier[item.severity] + damageTypeAdjustment[item.damageType] + confidenceAdjustment[item.confidence];

  return roundEstimateAmount(adjusted);
}

function normalizeDamageItem(raw: RawDamageAssessmentItem): DamageEstimateLineItem | null {
  if (
    !supportedVehicleAreas.includes(raw.vehicle_area as VehicleArea) ||
    !supportedDamageTypes.includes(raw.damage_type as DamageType) ||
    !supportedSeverities.includes(raw.severity as DamageSeverity) ||
    !supportedRepairActions.includes(raw.repair_action as RepairAction) ||
    !supportedConfidenceLevels.includes(raw.confidence as ConfidenceLevel)
  ) {
    return null;
  }

  const rationale = typeof raw.rationale === "string" ? raw.rationale.trim() : "";

  if (!rationale) {
    return null;
  }

  const vehicleArea = raw.vehicle_area as VehicleArea;
  const damageType = raw.damage_type as DamageType;
  const severity = raw.severity as DamageSeverity;
  const repairAction = raw.repair_action as RepairAction;
  const confidence = raw.confidence as ConfidenceLevel;
  const estimatedCost = calculateRepairCost({
    confidence,
    damageType,
    repairAction,
    severity,
    vehicleArea,
  });

  return {
    confidence,
    damageType,
    estimatedCost,
    label: `${toSentenceCase(vehicleArea)} ${toSentenceCase(damageType)}`,
    rationale,
    repairAction,
    severity,
    source: "ai_vision",
    vehicleArea,
  };
}

function buildAdjusterNotes(summary: string, lineItems: DamageEstimateLineItem[]) {
  const topAreas = lineItems
    .slice(0, 3)
    .map((item) => `${toSentenceCase(item.vehicleArea)} (${toSentenceCase(item.severity)})`)
    .join(", ");

  const noteLines = [
    "Photo-based damage assessment generated automatically from uploaded claim photos.",
    summary.trim(),
    topAreas ? `Priority review areas: ${topAreas}.` : "",
    "Review and adjust the estimate before sending it to the claimant.",
  ].filter((line) => line.length > 0);

  return noteLines.join("\n");
}

function extractResponseText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const responsePayload = payload as {
    output?: Array<{ content?: Array<{ text?: unknown; type?: unknown }> }>;
    output_text?: unknown;
  };

  if (typeof responsePayload.output_text === "string" && responsePayload.output_text.trim()) {
    return responsePayload.output_text;
  }

  if (!Array.isArray(responsePayload.output)) {
    return null;
  }

  const textParts: string[] = [];

  responsePayload.output.forEach((item) => {
    if (!Array.isArray(item.content)) {
      return;
    }

    item.content.forEach((contentItem) => {
      if (typeof contentItem.text === "string" && contentItem.text.trim()) {
        textParts.push(contentItem.text);
      }
    });
  });

  return textParts.length > 0 ? textParts.join("\n") : null;
}

function buildAssessmentPrompt(context: ClaimAssessmentContext) {
  const summary = [
    `Claim reference: ${context.refNumber ?? context.claimId}`,
    `Vehicle: ${extractVehicleSummary(context.vehicleInfo)}`,
    context.description ? `Claim description: ${context.description}` : "",
    "Identify only visible exterior damage from the uploaded photos.",
    "Choose the most likely repair action for each visible damage point.",
    "Do not assume hidden mechanical or structural damage that cannot be confirmed from the images.",
  ]
    .filter(Boolean)
    .join("\n");

  return summary;
}

async function requestDamageAssessment(context: ClaimAssessmentContext, photoUrls: string[]) {
  const openAiEnv = getOptionalOpenAiEnv();

  if (!openAiEnv?.apiKey) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiEnv.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openAiEnv.damageModel,
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text:
                "You are an auto insurance vision assessor. Return structured JSON only. Identify visible vehicle damage conservatively, avoid hidden damage assumptions, and produce concise rationales for each damage point.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildAssessmentPrompt(context),
            },
            ...photoUrls.map((signedUrl) => ({
              detail: "high",
              image_url: signedUrl,
              type: "input_image" as const,
            })),
          ],
        },
      ],
      max_output_tokens: 1400,
      store: false,
      text: {
        format: {
          name: "damage_assessment",
          schema: damageAssessmentSchema,
          strict: true,
          type: "json_schema",
        },
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as unknown;
  const outputText = extractResponseText(payload);

  if (!outputText) {
    return null;
  }

  try {
    return JSON.parse(outputText) as DamageAssessmentOutput;
  } catch {
    return null;
  }
}

export async function generateDamageAssessmentForClaim(context: ClaimAssessmentContext): Promise<DamageAssessmentResult | null> {
  const openAiEnv = getOptionalOpenAiEnv();

  if (!openAiEnv?.apiKey) {
    return null;
  }

  const signedPhotos = await getSignedPhotosForClaim(context.claimId);
  const photoUrls = signedPhotos.slice(0, maxAssessmentPhotos).map((photo) => photo.signedUrl);

  if (photoUrls.length === 0) {
    return null;
  }

  const assessmentPayload = await requestDamageAssessment(context, photoUrls);

  if (!assessmentPayload) {
    return null;
  }

  const summary = typeof assessmentPayload.summary === "string" ? assessmentPayload.summary.trim() : "";
  const rawItems = Array.isArray(assessmentPayload.damage_items) ? assessmentPayload.damage_items : [];
  const lineItems = rawItems
    .map((item) => normalizeDamageItem((item ?? {}) as RawDamageAssessmentItem))
    .filter((item): item is DamageEstimateLineItem => Boolean(item));

  if (!summary || lineItems.length === 0) {
    return null;
  }

  const totalAmount = lineItems.reduce((total, item) => total + item.estimatedCost, 0);

  return {
    adjusterNotes: buildAdjusterNotes(summary, lineItems),
    lineItems,
    totalAmount,
  };
}
